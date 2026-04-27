from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import sys
sys.path.insert(0, str(Path(__file__).resolve().parent / 'pydeps'))

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pyrogram import Client
from pyrogram.errors import SessionPasswordNeeded, RPCError

BASE_DIR = Path(__file__).resolve().parent
TELEGRAM_BOT_DIR = BASE_DIR.parent.parent / "telegram-bot"
SESSIONS_DIR = TELEGRAM_BOT_DIR / "sessions"
STATE_FILE = BASE_DIR / "auth_state.json"
API_ID = 31670889
API_HASH = "5e1e679bfc0255d5f116bb51acd94211"
MAX_ACCOUNTS = 3

SESSIONS_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="Spam dashboard backend")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

clients: dict[str, Client] = {}

DEFAULT_TEXTS = {
    "account1": "Привет, есть нормальные подрядчики по клинингу? А то попадаются одни распиздяи\nМне главное, чтобы на совесть делали и стандарты соблюдали",
    "account2": "Если в Питере или Казани, то могу рекомендовать этих ребят - http://avito.ru/brands/89d521a4fe29873dfd9f1f42c7e90b31/all/predlozheniya_uslug?src=search_seller_info&iid=7805656263&sellerId=19f4fba8e5fa09e037bed1c9bb1516d8",
    "account3": "Кстати, тоже к ним обращались, только через вк - https://vk.com/prommclean",
}
DEFAULT_CHATS = [
    "https://t.me/foodsafety_ru",
    "https://t.me/normtu",
    "https://t.me/Food_IndustryPRO",
    "https://t.me/INTEKPROM",
    "https://t.me/sanerity",
    "https://t.me/marafonhassp",
    "https://t.me/bezopasnosty",
    "https://t.me/ONlineOhranaTrudaEcoBIOT",
    "t.me/haccpmore",
]

class SendCodeRequest(BaseModel):
    sessionName: str
    phone: str

class VerifyCodeRequest(BaseModel):
    sessionName: str
    code: str

class VerifyPasswordRequest(BaseModel):
    sessionName: str
    password: str


def now_str() -> str:
    return datetime.now(timezone.utc).strftime("%d.%m.%Y %H:%M UTC")


def load_state() -> dict[str, Any]:
    if STATE_FILE.exists():
        return json.loads(STATE_FILE.read_text(encoding="utf-8"))
    return {"pending": {}}


def save_state(state: dict[str, Any]) -> None:
    STATE_FILE.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")


def session_files() -> list[str]:
    names = []
    for path in sorted(SESSIONS_DIR.glob("*.session")):
        names.append(path.stem)
    root_admin = TELEGRAM_BOT_DIR / "admin_bot.session"
    if root_admin.exists() and "admin_bot" not in names:
        names.append("admin_bot")
    return names


def build_label(me: Any, fallback: str) -> str:
    full = " ".join(part for part in [getattr(me, "first_name", None), getattr(me, "last_name", None)] if part).strip()
    if full:
        return full
    username = getattr(me, "username", None)
    if username:
        return f"@{username}"
    return fallback


def load_texts() -> dict[str, str]:
    path = TELEGRAM_BOT_DIR / "texts.json"
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    return DEFAULT_TEXTS.copy()


def load_chats() -> list[str]:
    path = TELEGRAM_BOT_DIR / "chats.txt"
    if path.exists():
        chats = [line.strip() for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]
        return chats or DEFAULT_CHATS.copy()
    return DEFAULT_CHATS.copy()


def session_path_candidates(session_name: str) -> list[Path]:
    if session_name == "admin_bot":
        return [TELEGRAM_BOT_DIR / "admin_bot.session"]
    return [SESSIONS_DIR / f"{session_name}.session"]


def delete_session_files(session_name: str) -> list[str]:
    removed: list[str] = []
    for base_path in session_path_candidates(session_name):
        candidates = [base_path]
        candidates.extend(sorted(base_path.parent.glob(f"{base_path.name}*")))
        seen: set[Path] = set()
        for candidate in candidates:
            if candidate in seen or not candidate.exists():
                continue
            seen.add(candidate)
            if candidate.is_file():
                candidate.unlink()
                removed.append(str(candidate))
    return removed


async def inspect_account(name: str) -> dict[str, Any]:
    display = name
    status = "Активен"
    reason = "Работает стабильно"
    try:
        workdir = str(TELEGRAM_BOT_DIR) if name == "admin_bot" and (TELEGRAM_BOT_DIR / "admin_bot.session").exists() else str(SESSIONS_DIR)
        client = Client(name, api_id=API_ID, api_hash=API_HASH, workdir=workdir)
        await client.start()
        me = await client.get_me()
        display = build_label(me, name)
        await client.stop()
    except Exception as exc:
        status = "Ошибка"
        reason = str(exc)[:120]
    return {"name": name, "label": display, "status": status, "reason": reason, "lastCheck": now_str()}


@app.get('/api/state')
async def api_state():
    accounts = [await inspect_account(name) for name in session_files()]
    return {
        "project": {
            "id": "cleaning",
            "name": "Клининг",
            "accounts": accounts,
            "chats": load_chats(),
            "messages": {
                "first": load_texts().get("account1", DEFAULT_TEXTS["account1"]),
                "second": load_texts().get("account2", DEFAULT_TEXTS["account2"]),
                "third": load_texts().get("account3", DEFAULT_TEXTS["account3"]),
            },
            "maxAccounts": MAX_ACCOUNTS,
        }
    }


@app.post('/api/send-code')
async def send_code(payload: SendCodeRequest):
    session_name = payload.sessionName.strip()
    phone = payload.phone.strip()
    if not session_name or not phone:
        raise HTTPException(status_code=400, detail='Нужно имя сессии и номер телефона')

    current_accounts = session_files()
    if session_name not in current_accounts and len(current_accounts) >= MAX_ACCOUNTS:
        raise HTTPException(status_code=400, detail=f'Достигнут лимит: максимум {MAX_ACCOUNTS} аккаунта')

    if session_name == 'admin_bot':
        workdir = str(TELEGRAM_BOT_DIR)
    else:
        workdir = str(SESSIONS_DIR)

    try:
        client = Client(session_name, api_id=API_ID, api_hash=API_HASH, workdir=workdir)
        await client.connect()
        sent = await client.send_code(phone)
        clients[session_name] = client
        state = load_state()
        state['pending'][session_name] = {
            'phone': phone,
            'phone_code_hash': sent.phone_code_hash,
            'workdir': workdir,
            'createdAt': now_str(),
        }
        save_state(state)
        return {'ok': True, 'message': 'Код отправлен', 'type': str(getattr(sent.type, 'value', sent.type))}
    except RPCError as exc:
        raise HTTPException(status_code=400, detail=f'Telegram: {exc.__class__.__name__}: {exc}')
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f'Backend: {exc}')


@app.post('/api/verify-code')
async def verify_code(payload: VerifyCodeRequest):
    session_name = payload.sessionName.strip()
    code = payload.code.strip()
    state = load_state()
    pending = state.get('pending', {}).get(session_name)
    if not pending:
        raise HTTPException(status_code=400, detail='Нет незавершённого входа для этой сессии')
    client = clients.get(session_name)
    if client is None:
        client = Client(session_name, api_id=API_ID, api_hash=API_HASH, workdir=pending['workdir'])
        await client.connect()
        clients[session_name] = client
    try:
        await client.sign_in(phone_number=pending['phone'], phone_code_hash=pending['phone_code_hash'], phone_code=code)
        me = await client.get_me()
        await client.disconnect()
        clients.pop(session_name, None)
        state['pending'].pop(session_name, None)
        save_state(state)
        return {'ok': True, 'authorized': True, 'label': build_label(me, session_name), 'message': 'Аккаунт подключён'}
    except SessionPasswordNeeded:
        return {'ok': True, 'needPassword': True, 'message': 'Нужен пароль 2FA'}
    except RPCError as exc:
        raise HTTPException(status_code=400, detail=f'Telegram: {exc.__class__.__name__}: {exc}')
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f'Backend: {exc}')


@app.post('/api/verify-password')
async def verify_password(payload: VerifyPasswordRequest):
    session_name = payload.sessionName.strip()
    password = payload.password.strip()
    state = load_state()
    pending = state.get('pending', {}).get(session_name)
    if not pending:
        raise HTTPException(status_code=400, detail='Нет незавершённого входа для этой сессии')
    client = clients.get(session_name)
    if client is None:
        client = Client(session_name, api_id=API_ID, api_hash=API_HASH, workdir=pending['workdir'])
        await client.connect()
        clients[session_name] = client
    try:
        await client.check_password(password)
        me = await client.get_me()
        await client.disconnect()
        clients.pop(session_name, None)
        state['pending'].pop(session_name, None)
        save_state(state)
        return {'ok': True, 'authorized': True, 'label': build_label(me, session_name), 'message': 'Аккаунт подключён через 2FA'}
    except RPCError as exc:
        raise HTTPException(status_code=400, detail=f'Telegram: {exc.__class__.__name__}: {exc}')
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f'Backend: {exc}')


@app.delete('/api/account/{session_name}')
async def delete_account(session_name: str):
    existing_accounts = session_files()
    if session_name not in existing_accounts:
        raise HTTPException(status_code=404, detail='Аккаунт не найден')

    client = clients.pop(session_name, None)
    if client is not None:
        try:
            await client.disconnect()
        except Exception:
            pass

    state = load_state()
    if session_name in state.get('pending', {}):
        state['pending'].pop(session_name, None)
        save_state(state)

    removed = delete_session_files(session_name)
    if not removed:
        return JSONResponse(status_code=409, content={'ok': False, 'detail': 'Файлы сессии не удалены'})

    return {'ok': True, 'message': 'Аккаунт удалён', 'removed': removed}


@app.get('/api/health')
async def health():
    return {'ok': True, 'time': now_str()}
