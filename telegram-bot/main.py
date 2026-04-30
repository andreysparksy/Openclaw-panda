import asyncio
import logging
import sqlite3
import json
import os
import random
import re
from datetime import datetime
from pyrogram import Client, filters
from pyrogram.types import Message, CallbackQuery, InlineKeyboardMarkup, InlineKeyboardButton
from pyrogram.errors import FloodWait, RPCError, UserAlreadyParticipant, InviteHashExpired, InviteHashInvalid, UsernameInvalid, UsernameNotOccupied

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
logger = logging.getLogger(__name__)

API_ID = 31670889
API_HASH = "5e1e679bfc0255d5f116bb51acd94211"
TOKEN = "8553222645:AAFrO3sPdKQaJ8RFzSnD4PMtCvdalQneHW4"

TEXTS_FILE = "texts.json"
CHATS_FILE = "chats.txt"
DB_FILE = "logs.db"

DELAY_AFTER_JOIN = 5
DELAY_BETWEEN_MESSAGES = (11, 22)
DELAY_BETWEEN_CHATS = (32, 42)

admin_bot = None
current_send_task = None
waiting_for_text = False
waiting_for_chat = False
current_edit_field = None
waiting_for_upload = False

def init_db():
    conn = sqlite3.connect(DB_FILE, timeout=10)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            chat_id TEXT,
            chat_title TEXT,
            account TEXT,
            message_text TEXT,
            message_id INTEGER,
            status TEXT,
            error TEXT,
            timestamp TEXT
        )
    ''')
    conn.commit()
    conn.close()

def extract_username(chat_input):
    chat_input = chat_input.strip()
    match = re.search(r'(?:https?://)?t\.me/([^/?]+)', chat_input)
    if match:
        return f"@{match.group(1)}"
    if chat_input.startswith('@'):
        return chat_input
    return f"@{chat_input}"

def load_texts():
    if os.path.exists(TEXTS_FILE):
        with open(TEXTS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {
        "account1": "Привет, есть нормальные подрядчики по клинингу?",
        "account2": "Если в Питере или Казани, то могу рекомендовать этих ребят",
        "account3": "Кстати, тоже к ним обращались, только через вк"
    }

def save_texts(texts):
    with open(TEXTS_FILE, 'w', encoding='utf-8') as f:
        json.dump(texts, f, ensure_ascii=False, indent=2)

def load_chats():
    if os.path.exists(CHATS_FILE):
        with open(CHATS_FILE, 'r', encoding='utf-8') as f:
            chats = [line.strip() for line in f if line.strip()]
            if chats:
                return chats
    return [
        "https://t.me/foodsafety_ru",
        "https://t.me/normtu",
        "https://t.me/Food_IndustryPRO",
        "https://t.me/INTEKPROM",
        "https://t.me/sanerity",
        "https://t.me/marafonhassp",
        "https://t.me/bezopasnosty",
        "https://t.me/ONlineOhranaTrudaEcoBIOT",
        "t.me/haccpmore"
    ]

def save_chats(chats):
    with open(CHATS_FILE, 'w', encoding='utf-8') as f:
        f.write('\n'.join(chats))

def log_to_db(chat_id, chat_title, account, message_text, message_id, status, error):
    try:
        conn = sqlite3.connect(DB_FILE, timeout=10)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO logs (chat_id, chat_title, account, message_text, message_id, status, error, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (chat_id, chat_title, account, message_text, message_id, status, error, datetime.now().isoformat()))
        conn.commit()
        conn.close()
    except Exception as e:
        logger.error(f"Ошибка лога: {e}")

def get_main_keyboard():
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("Тексты", callback_data="menu_texts")],
        [InlineKeyboardButton("Чаты", callback_data="menu_chats")],
        [InlineKeyboardButton("Аккаунты", callback_data="menu_accounts")],
        [InlineKeyboardButton("Логи", callback_data="menu_logs")],
        [InlineKeyboardButton("Запуск", callback_data="start_send")],
        [InlineKeyboardButton("Остановить", callback_data="stop_send")]
    ])

def get_texts_keyboard():
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("Аккаунт 1", callback_data="edit_text_account1")],
        [InlineKeyboardButton("Аккаунт 2", callback_data="edit_text_account2")],
        [InlineKeyboardButton("Аккаунт 3", callback_data="edit_text_account3")],
        [InlineKeyboardButton("Назад", callback_data="back_main")]
    ])

def get_chats_keyboard():
    chats = load_chats()
    buttons = []
    for idx, chat in enumerate(chats):
        short_chat = chat[:35] + "..." if len(chat) > 35 else chat
        buttons.append([InlineKeyboardButton(f"{idx+1}. {short_chat}", callback_data=f"del_chat_{idx}")])
    buttons.append([InlineKeyboardButton("Добавить чат", callback_data="add_chat")])
    buttons.append([InlineKeyboardButton("Назад", callback_data="back_main")])
    return InlineKeyboardMarkup(buttons)

def get_accounts_keyboard():
    sessions_dir = "sessions"
    accounts = []
    if os.path.exists(sessions_dir):
        for file in os.listdir(sessions_dir):
            if file.endswith(".session"):
                accounts.append(file.replace(".session", ""))
    buttons = []
    for account in accounts:
        buttons.append([InlineKeyboardButton(account, callback_data=f"account_{account}")])
    buttons.append([InlineKeyboardButton("Загрузить сессию файлом", callback_data="upload_session")])
    buttons.append([InlineKeyboardButton("Назад", callback_data="back_main")])
    return InlineKeyboardMarkup(buttons)

async def join_chat(client, chat_link, account_name):
    try:
        username = extract_username(chat_link)
        chat = await client.get_chat(username)
        try:
            await client.join_chat(username)
            logger.info(f"{account_name} присоединился: {chat.title}")
            return chat, None
        except UserAlreadyParticipant:
            logger.info(f"{account_name} уже в чате: {chat.title}")
            return chat, None
    except (UsernameInvalid, UsernameNotOccupied):
        return None, "Чат не найден"
    except InviteHashExpired:
        return None, "Ссылка устарела"
    except InviteHashInvalid:
        return None, "Неверная ссылка"
    except Exception as e:
        return None, str(e)

async def safe_send(client, chat_id, text, account_name, reply_to=None):
    try:
        if reply_to:
            msg = await client.send_message(chat_id, text, reply_to_message_id=reply_to)
        else:
            msg = await client.send_message(chat_id, text)
        logger.info(f"{account_name} -> отправлено")
        return msg, None
    except FloodWait as e:
        await asyncio.sleep(e.value)
        return await safe_send(client, chat_id, text, account_name, reply_to)
    except Exception as e:
        return None, str(e)

async def process_chat(client1, client2, client3, chat_link):
    try:
        chat1, error1 = await join_chat(client1, chat_link, "Аккаунт1")
        if error1:
            return False
        chat2, error2 = await join_chat(client2, chat_link, "Аккаунт2")
        if error2:
            return False
        chat3, error3 = await join_chat(client3, chat_link, "Аккаунт3")
        if error3:
            return False
        chat_id = chat1.id
        chat_title = chat1.title or chat_link
        await asyncio.sleep(DELAY_AFTER_JOIN)
        texts = load_texts()
        msg1, err1 = await safe_send(client1, chat_id, texts["account1"], "Аккаунт1")
        if err1:
            return False
        await asyncio.sleep(random.randint(DELAY_BETWEEN_MESSAGES[0], DELAY_BETWEEN_MESSAGES[1]))
        msg2, err2 = await safe_send(client2, chat_id, texts["account2"], "Аккаунт2", reply_to=msg1.id)
        if err2:
            return False
        await asyncio.sleep(random.randint(DELAY_BETWEEN_MESSAGES[0], DELAY_BETWEEN_MESSAGES[1]))
        msg3, err3 = await safe_send(client3, chat_id, texts["account3"], "Аккаунт3", reply_to=msg2.id)
        if err3:
            return False
        return True
    except Exception as e:
        logger.error(f"Ошибка: {e}")
        return False

async def run_send():
    global current_send_task
    chats = load_chats()
    if not chats:
        logger.warning("Нет чатов")
        return
    if not os.path.exists("sessions"):
        logger.error("Папка sessions не найдена")
        return
    sessions = [f.replace(".session", "") for f in os.listdir("sessions") if f.endswith(".session")]
    if len(sessions) < 3:
        logger.error("Нужно минимум 3 аккаунта")
        return
    session1 = Client(sessions[0], api_id=API_ID, api_hash=API_HASH, workdir="sessions")
    session2 = Client(sessions[1], api_id=API_ID, api_hash=API_HASH, workdir="sessions")
    session3 = Client(sessions[2], api_id=API_ID, api_hash=API_HASH, workdir="sessions")
    try:
        await session1.start()
        await session2.start()
        await session3.start()
    except Exception as e:
        logger.error(f"Ошибка сессий: {e}")
        return
    for idx, chat in enumerate(chats):
        if current_send_task and current_send_task.cancelled():
            break
        success = await process_chat(session1, session2, session3, chat)
        if idx < len(chats) - 1:
            await asyncio.sleep(random.randint(DELAY_BETWEEN_CHATS[0], DELAY_BETWEEN_CHATS[1]))
    await session1.stop()
    await session2.stop()
    await session3.stop()

async def main():
    global admin_bot, waiting_for_upload
    init_db()
    if not os.path.exists("sessions"):
        os.makedirs("sessions")
    
    admin_bot = Client("admin_bot", api_id=API_ID, api_hash=API_HASH, bot_token=TOKEN)
    await admin_bot.start()
    logger.info("Бот запущен")
    
    @admin_bot.on_message(filters.command("start"))
    async def start_cmd(client, message):
        await message.reply("Панель управления ботом", reply_markup=get_main_keyboard())
    
    @admin_bot.on_message(filters.document & filters.private)
    async def handle_upload(client, message):
        global waiting_for_upload
        if waiting_for_upload:
            document = message.document
            if document.file_name.endswith('.session'):
                file_path = os.path.join("sessions", document.file_name)
                await message.download(file_path)
                waiting_for_upload = False
                await message.reply(f"Сессия {document.file_name} загружена", reply_markup=get_accounts_keyboard())
            else:
                await message.reply("Нужен .session файл", reply_markup=get_accounts_keyboard())
    
    @admin_bot.on_message(filters.text & filters.private & ~filters.command("start"))
    async def text_handler(client, message):
        global waiting_for_text, waiting_for_chat, current_edit_field
        
        text = message.text.strip()
        
        if waiting_for_text and current_edit_field:
            texts = load_texts()
            texts[current_edit_field] = text
            save_texts(texts)
            waiting_for_text = False
            current_edit_field = None
            await message.reply("Текст обновлен", reply_markup=get_texts_keyboard())
        
        elif waiting_for_chat:
            chats = load_chats()
            chats.append(text)
            save_chats(chats)
            waiting_for_chat = False
            await message.reply("Чат добавлен", reply_markup=get_chats_keyboard())
    
    @admin_bot.on_callback_query()
    async def callback_handler(client, callback_query):
        global current_send_task, waiting_for_text, waiting_for_chat, current_edit_field
        global waiting_for_upload
        
        data = callback_query.data
        
        if data == "back_main":
            await callback_query.message.edit_text("Панель управления ботом", reply_markup=get_main_keyboard())
        
        elif data == "menu_texts":
            await callback_query.message.edit_text("Выберите текст для редактирования", reply_markup=get_texts_keyboard())
        
        elif data == "menu_chats":
            chats = load_chats()
            text = "Список чатов:\n" + "\n".join([f"{i+1}. {c}" for i, c in enumerate(chats)]) if chats else "Нет чатов"
            await callback_query.message.edit_text(text, reply_markup=get_chats_keyboard())
        
        elif data == "menu_accounts":
            await callback_query.message.edit_text("Управление аккаунтами", reply_markup=get_accounts_keyboard())
        
        elif data == "menu_logs":
            conn = sqlite3.connect(DB_FILE)
            cursor = conn.cursor()
            cursor.execute("SELECT chat_title, account, status, timestamp FROM logs ORDER BY id DESC LIMIT 10")
            logs = cursor.fetchall()
            conn.close()
            text = "Последние 10 записей:\n" + "\n".join([f"{l[3]} | {l[0]} | {l[1]} | {l[2]}" for l in logs]) if logs else "Нет логов"
            await callback_query.message.edit_text(text[:4000], reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("Назад", callback_data="back_main")]]))
        
        elif data == "start_send":
            await callback_query.message.edit_text("Рассылка запущена. Смотрите логи в консоли.", reply_markup=get_main_keyboard())
            if current_send_task:
                current_send_task.cancel()
            current_send_task = asyncio.create_task(run_send())
        
        elif data == "stop_send":
            if current_send_task:
                current_send_task.cancel()
            await callback_query.message.edit_text("Рассылка остановлена", reply_markup=get_main_keyboard())
        
        elif data == "upload_session":
            waiting_for_upload = True
            await callback_query.message.edit_text("Отправьте .session файл", reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("Отмена", callback_data="menu_accounts")]]))
        
        elif data.startswith("edit_text_"):
            field = data.replace("edit_text_", "")
            texts = load_texts()
            current_edit_field = field
            waiting_for_text = True
            await callback_query.message.edit_text(f"Текущий текст:\n{texts.get(field, '')}\n\nОтправьте новый текст:", reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("Отмена", callback_data="menu_texts")]]))
        
        elif data.startswith("del_chat_"):
            idx = int(data.replace("del_chat_", ""))
            chats = load_chats()
            if idx < len(chats):
                chats.pop(idx)
                save_chats(chats)
            await callback_query.answer("Удалено")
            chats = load_chats()
            text = "Список чатов:\n" + "\n".join([f"{i+1}. {c}" for i, c in enumerate(chats)]) if chats else "Нет чатов"
            await callback_query.message.edit_text(text, reply_markup=get_chats_keyboard())
        
        elif data == "add_chat":
            waiting_for_chat = True
            await callback_query.message.edit_text("Отправьте ссылку на чат\nПример: https://t.me/chat или @chat", reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("Отмена", callback_data="menu_chats")]]))
        
        elif data.startswith("check_"):
            account_name = data.replace("check_", "")
            await callback_query.answer("Проверка...")
            try:
                cl = Client(account_name, api_id=API_ID, api_hash=API_HASH, workdir="sessions")
                await cl.start()
                me = await cl.get_me()
                await cl.stop()
                await callback_query.message.edit_text(f"Аккаунт: {account_name}\n\nСтатус: РАБОТАЕТ\nИмя: {me.first_name}\nЮзернейм: @{me.username if me.username else 'нет'}", reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("Назад", callback_data="menu_accounts")]]))
            except Exception as e:
                await callback_query.message.edit_text(f"Аккаунт: {account_name}\n\nСтатус: ОШИБКА\n{str(e)[:100]}", reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("Назад", callback_data="menu_accounts")]]))
        
        elif data.startswith("del_account_"):
            account_name = data.replace("del_account_", "")
            session_path = os.path.join("sessions", f"{account_name}.session")
            if os.path.exists(session_path):
                os.remove(session_path)
            await callback_query.answer("Удалено")
            await callback_query.message.edit_text("Управление аккаунтами", reply_markup=get_accounts_keyboard())
        
        elif data.startswith("account_"):
            account_name = data.replace("account_", "")
            await callback_query.message.edit_text(f"Аккаунт: {account_name}\n\nВыберите действие:", reply_markup=InlineKeyboardMarkup([
                [InlineKeyboardButton("Проверить", callback_data=f"check_{account_name}")],
                [InlineKeyboardButton("Удалить", callback_data=f"del_account_{account_name}")],
                [InlineKeyboardButton("Назад", callback_data="menu_accounts")]
            ]))
        
        await callback_query.answer()
    
    try:
        await asyncio.Future()
    except asyncio.CancelledError:
        pass
    finally:
        await admin_bot.stop()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Бот остановлен")
