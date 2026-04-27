import asyncio
import logging
import sqlite3
import json
import os
import random
import re
import signal
from datetime import datetime
import asyncio
import logging
import sqlite3
import json
import os
import random
import re
import signal
from datetime import datetime
from pyrogram import Client, filters
from pyrogram.types import Message, CallbackQuery, InlineKeyboardMarkup, InlineKeyboardButton
from pyrogram.errors import FloodWait, RPCError, UserAlreadyParticipant, InviteHashExpired, InviteHashInvalid, UsernameInvalid, UsernameNotOccupied

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
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
waiting_for_account = False
waiting_for_phone = False
waiting_for_code = False
waiting_for_password = False
current_account_phone = None
current_account_name = None
account_code = None

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
        "account1": "Привет, есть нормальные подрядчики по клинингу? А то попадаются одни распиздяи\nМне главное, чтобы на совесть делали и стандарты соблюдали",
        "account2": "Если в Питере или Казани, то могу рекомендовать этих ребят - http://avito.ru/brands/89d521a4fe29873dfd9f1f42c7e90b31/all/predlozheniya_uslug?src=search_seller_info&iid=7805656263&sellerId=19f4fba8e5fa09e037bed1c9bb1516d8",
        "account3": "Кстати, тоже к ним обращались, только через вк - https://vk.com/prommclean"
    }

def save_texts(texts):
    with open(TEXTS_FILE, 'w', encoding='utf-8') as f:
        json.dump(texts, f, ensure_ascii=False, indent=2)

def load_chats():
    if os.path.exists(CHATS_FILE):
        with open(CHATS_FILE, 'r', encoding='utf-8') as f:
            chats = [line.strip() for line in f if line.strip()]
            if not chats:
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
        logger.error(f"Log error: {e}")

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
                account_name = file.replace(".session", "")
                accounts.append(account_name)
    
    buttons = []
    for account in accounts:
        buttons.append([
            InlineKeyboardButton(f"{account}", callback_data=f"account_{account}"),
            InlineKeyboardButton("Проверить", callback_data=f"check_{account}"),
            InlineKeyboardButton("Удалить", callback_data=f"del_account_{account}")
        ])
    buttons.append([InlineKeyboardButton("Добавить аккаунт", callback_data="add_account")])
    buttons.append([InlineKeyboardButton("Назад", callback_data="back_main")])
    return InlineKeyboardMarkup(buttons)

async def check_account(account_name):
    try:
        client = Client(account_name, api_id=API_ID, api_hash=API_HASH, workdir="sessions")
        await client.start()
        me = await client.get_me()
        await client.stop()
        return True, f"Работает: {me.first_name} (@{me.username})" if me.username else f"Работает: {me.first_name}"
    except Exception as e:
        return False, f"Ошибка: {str(e)[:50]}"

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
        logger.error(f"{account_name} чат не найден: {chat_link}")
        return None, "Chat not found"
    except InviteHashExpired:
        logger.error(f"{account_name} ссылка устарела: {chat_link}")
        return None, "Invite link expired"
    except InviteHashInvalid:
        logger.error(f"{account_name} неверная ссылка: {chat_link}")
        return None, "Invalid invite link"
    except RPCError as e:
        logger.error(f"{account_name} ошибка: {e}")
        return None, str(e)
    except Exception as e:
        logger.error(f"{account_name} ошибка: {e}")
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
        logger.warning(f"Flood wait {e.value} сек для {account_name}")
        await asyncio.sleep(e.value)
        return await safe_send(client, chat_id, text, account_name, reply_to)
    except RPCError as e:
        logger.error(f"{account_name} -> ошибка: {e}")
        return None, str(e)
    except Exception as e:
        logger.error(f"{account_name} -> ошибка: {e}")
        return None, str(e)

async def process_chat(client1, client2, client3, chat_link):
    try:
        chat1, error1 = await join_chat(client1, chat_link, "Аккаунт1")
        if error1:
            log_to_db(chat_link, chat_link, "Аккаунт1", "", 0, "Ошибка", f"Join: {error1}")
            return False
        
        chat2, error2 = await join_chat(client2, chat_link, "Аккаунт2")
        if error2:
            log_to_db(chat_link, chat_link, "Аккаунт2", "", 0, "Ошибка", f"Join: {error2}")
            return False
        
        chat3, error3 = await join_chat(client3, chat_link, "Аккаунт3")
        if error3:
            log_to_db(chat_link, chat_link, "Аккаунт3", "", 0, "Ошибка", f"Join: {error3}")
            return False
        
        chat_id = chat1.id
        chat_title = chat1.title or chat_link
        
        logger.info(f"Чат: {chat_title}")
        logger.info(f"Ожидание {DELAY_AFTER_JOIN} сек")
        await asyncio.sleep(DELAY_AFTER_JOIN)
        
        texts = load_texts()
        
        msg1, send_error = await safe_send(client1, chat_id, texts["account1"], "Аккаунт1")
        if send_error:
            log_to_db(chat_id, chat_title, "Аккаунт1", texts["account1"], 0, "Ошибка", send_error)
            return False
        log_to_db(chat_id, chat_title, "Аккаунт1", texts["account1"], msg1.id, "Отправлено", None)
        
        delay1 = random.randint(DELAY_BETWEEN_MESSAGES[0], DELAY_BETWEEN_MESSAGES[1])
        logger.info(f"Ожидание {delay1} сек")
        await asyncio.sleep(delay1)
        
        msg2, send_error2 = await safe_send(client2, chat_id, texts["account2"], "Аккаунт2", reply_to=msg1.id)
        if send_error2:
            log_to_db(chat_id, chat_title, "Аккаунт2", texts["account2"], 0, "Ошибка", send_error2)
            return False
        log_to_db(chat_id, chat_title, "Аккаунт2", texts["account2"], msg2.id, "Отправлено", None)
        
        delay2 = random.randint(DELAY_BETWEEN_MESSAGES[0], DELAY_BETWEEN_MESSAGES[1])
        logger.info(f"Ожидание {delay2} сек")
        await asyncio.sleep(delay2)
        
        msg3, send_error3 = await safe_send(client3, chat_id, texts["account3"], "Аккаунт3", reply_to=msg2.id)
        if send_error3:
            log_to_db(chat_id, chat_title, "Аккаунт3", texts["account3"], 0, "Ошибка", send_error3)
            return False
        log_to_db(chat_id, chat_title, "Аккаунт3", texts["account3"], msg3.id, "Отправлено", None)
        
        logger.info(f"Чат {chat_title} завершен")
        return True
        
    except FloodWait as e:
        logger.warning(f"Flood wait {e.value} сек")
        await asyncio.sleep(e.value)
        return False
    except RPCError as e:
        logger.error(f"RPC ошибка: {e}")
        log_to_db(chat_link, chat_link, "Система", "", 0, "Ошибка", str(e))
        return False
    except Exception as e:
        logger.error(f"Ошибка: {e}")
        log_to_db(chat_link, chat_link, "Система", "", 0, "Ошибка", str(e))
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
    
    sessions = []
    for file in os.listdir("sessions"):
        if file.endswith(".session"):
            sessions.append(file.replace(".session", ""))
    
    if len(sessions) < 3:
        logger.error("Нужно минимум 3 аккаунта")
        return
    
    session1 = Client(sessions[0], api_id=API_ID, api_hash=API_HASH, workdir="sessions")
    session2 = Client(sessions[1], api_id=API_ID, api_hash=API_HASH, workdir="sessions")
    session3 = Client(sessions[2], api_id=API_ID, api_hash=API_HASH, workdir="sessions")
    
    try:
        logger.info(f"Запуск {sessions[0]}")
        await session1.start()
        logger.info(f"Запуск {sessions[1]}")
        await session2.start()
        logger.info(f"Запуск {sessions[2]}")
        await session3.start()
    except Exception as e:
        logger.error(f"Ошибка сессий: {e}")
        return
    
    logger.info(f"Всего чатов: {len(chats)}")
    
    for idx, chat in enumerate(chats):
        if current_send_task and current_send_task.cancelled():
            logger.info("Остановлено")
            break
            
        logger.info(f"Чат {idx+1}/{len(chats)}: {chat}")
        success = await process_chat(session1, session2, session3, chat)
        
        if success:
            logger.info(f"Чат {idx+1} успешно")
        else:
            logger.warning(f"Чат {idx+1} провален")
        
        if idx < len(chats) - 1:
            delay = random.randint(DELAY_BETWEEN_CHATS[0], DELAY_BETWEEN_CHATS[1])
            logger.info(f"Ожидание {delay} сек")
            await asyncio.sleep(delay)
    
    await session1.stop()
    await session2.stop()
    await session3.stop()
    
    logger.info("Завершено")

def setup_handlers():
    @admin_bot.on_message(filters.command("start"))
    async def start_command(client, message):
        await message.reply("Управление ботом", reply_markup=get_main_keyboard())
    
    @admin_bot.on_message(filters.text & filters.private & ~filters.command("start"))
    async def handle_text_messages(client, message: Message):
        global waiting_for_text, waiting_for_chat, current_edit_field, waiting_for_account, waiting_for_phone, waiting_for_code, waiting_for_password, current_account_phone, current_account_name, account_code
        
        if waiting_for_text and current_edit_field:
            new_text = message.text
            texts = load_texts()
            texts[current_edit_field] = new_text
            save_texts(texts)
            waiting_for_text = False
            current_edit_field = None
            await message.reply("Текст обновлен", reply_markup=get_texts_keyboard())
            
        elif waiting_for_chat:
            try:
                chat_input = message.text.strip()
                if chat_input:
                    chats = load_chats()
                    chats.append(chat_input)
                    save_chats(chats)
                    waiting_for_chat = False
                    await message.reply(f"Чат добавлен: {chat_input}", reply_markup=get_chats_keyboard())
                else:
                    await message.reply("Пустая ссылка")
            except Exception as e:
                await message.reply(f"Ошибка: {e}")
        
        elif waiting_for_phone and current_account_name:
            current_account_phone = message.text.strip()
            waiting_for_phone = False
            waiting_for_code = True
            await message.reply("Введите код подтверждения из Telegram:")
        
        elif waiting_for_code and current_account_name and current_account_phone:
            account_code = message.text.strip()
            waiting_for_code = False
            try:
                client = Client(current_account_name, api_id=API_ID, api_hash=API_HASH, workdir="sessions")
                await client.connect()
                
                try:
                    sent_code = await client.send_code(current_account_phone)
                    await client.sign_in(current_account_phone, account_code)
                    await client.stop()
                    await message.reply(f"Аккаунт {current_account_name} успешно добавлен!", reply_markup=get_accounts_keyboard())
                except Exception as e:
                    if "SESSION_PASSWORD_NEEDED" in str(e):
                        waiting_for_password = True
                        await message.reply("Введите пароль двухфакторной аутентификации:")
                    else:
                        await client.stop()
                        await message.reply(f"Ошибка: {str(e)}", reply_markup=get_accounts_keyboard())
            except Exception as e:
                await message.reply(f"Ошибка: {str(e)}", reply_markup=get_accounts_keyboard())
                if 'client' in locals():
                    await client.stop()
            
            current_account_phone = None
            current_account_name = None
            account_code = None
        
        elif waiting_for_password and current_account_name:
            password = message.text.strip()
            waiting_for_password = False
            try:
                client = Client(current_account_name, api_id=API_ID, api_hash=API_HASH, workdir="sessions")
                await client.connect()
                await client.check_password(password)
                await client.stop()
                await message.reply(f"Аккаунт {current_account_name} успешно добавлен!", reply_markup=get_accounts_keyboard())
            except Exception as e:
                await message.reply(f"Ошибка: {str(e)}", reply_markup=get_accounts_keyboard())
                if 'client' in locals():
                    await client.stop()
            
            current_account_name = None

    @admin_bot.on_callback_query()
    async def handle_callback(client, callback_query: CallbackQuery):
        global current_send_task, waiting_for_text, waiting_for_chat, current_edit_field, waiting_for_account, waiting_for_phone, waiting_for_code, waiting_for_password, current_account_phone, current_account_name, account_code
        
        data = callback_query.data
        
        if data == "back_main":
            await callback_query.message.edit_text("Управление ботом", reply_markup=get_main_keyboard())
            await callback_query.answer()
            return
        
        if data == "menu_texts":
            await callback_query.message.edit_text("Выберите текст для редактирования", reply_markup=get_texts_keyboard())
            await callback_query.answer()
            return
        
        if data == "menu_chats":
            chats = load_chats()
            text = "Список чатов:\n\n" + "\n".join([f"{idx+1}. {chat}" for idx, chat in enumerate(chats)]) if chats else "Нет чатов"
            await callback_query.message.edit_text(text, reply_markup=get_chats_keyboard())
            await callback_query.answer()
            return
        
        if data == "menu_accounts":
            await callback_query.message.edit_text("Управление аккаунтами", reply_markup=get_accounts_keyboard())
            await callback_query.answer()
            return
        
        if data == "menu_logs":
            conn = sqlite3.connect(DB_FILE, timeout=10)
            cursor = conn.cursor()
            cursor.execute("SELECT chat_title, account, status, timestamp FROM logs ORDER BY id DESC LIMIT 10")
            logs = cursor.fetchall()
            conn.close()
            
            if logs:
                text = "Последние 10 записей:\n\n"
                for log in logs:
                    text += f"{log[3]} | {log[0]} | {log[1]} | {log[2]}\n"
            else:
                text = "Логов нет"
            
            await callback_query.message.edit_text(text[:4000], reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("Назад", callback_data="back_main")]]))
            await callback_query.answer()
            return
        
        if data == "start_send":
            await callback_query.message.edit_text("Рассылка запущена. Смотрите логи в консоли.", reply_markup=get_main_keyboard())
            await callback_query.answer()
            if current_send_task and not current_send_task.done():
                current_send_task.cancel()
            current_send_task = asyncio.create_task(run_send())
            return
        
        if data == "stop_send":
            if current_send_task and not current_send_task.done():
                current_send_task.cancel()
                await callback_query.message.edit_text("Рассылка остановлена", reply_markup=get_main_keyboard())
            else:
                await callback_query.message.edit_text("Рассылка не запущена", reply_markup=get_main_keyboard())
            await callback_query.answer()
            return
        
        if data.startswith("edit_text_"):
            field = data.replace("edit_text_", "")
            current_texts = load_texts()
            current_text = current_texts.get(field, "")
            current_edit_field = field
            waiting_for_text = True
            
            await callback_query.message.edit_text(
                f"Редактирование текста {field}:\n\n{current_text}\n\nОтправьте новый текст:",
                reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("Отмена", callback_data="menu_texts")]])
            )
            await callback_query.answer()
            return
        
        if data.startswith("del_chat_"):
            idx = int(data.replace("del_chat_", ""))
            chats = load_chats()
            if 0 <= idx < len(chats):
                removed = chats.pop(idx)
                save_chats(chats)
                await callback_query.answer(f"Удален: {removed}")
            
            chats = load_chats()
            text = "Список чатов:\n\n" + "\n".join([f"{idx+1}. {chat}" for idx, chat in enumerate(chats)]) if chats else "Нет чатов"
            await callback_query.message.edit_text(text, reply_markup=get_chats_keyboard())
            return
        
        if data == "add_chat":
            waiting_for_chat = True
            await callback_query.message.edit_text(
                "Отправьте ссылку на чат\n\nПример: https://t.me/chat или @chat",
                reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("Отмена", callback_data="menu_chats")]])
            )
            await callback_query.answer()
            return
        
        if data == "add_account":
            waiting_for_account = True
            await callback_query.message.edit_text(
                "Введите имя для новой сессии (только латиница, цифры и _):\n\nПример: session3",
                reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("Отмена", callback_data="menu_accounts")]])
            )
            await callback_query.answer()
            return
        
        if data.startswith("check_"):
            account_name = data.replace("check_", "")
            await callback_query.answer("Проверяю...")
            status, message = await check_account(account_name)
            await callback_query.message.edit_text(
                f"Аккаунт: {account_name}\n\n{message}",
                reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("Назад к аккаунтам", callback_data="menu_accounts")]])
            )
            return
        
        if data.startswith("del_account_"):
            account_name = data.replace("del_account_", "")
            session_path = os.path.join("sessions", f"{account_name}.session")
            if os.path.exists(session_path):
                os.remove(session_path)
                await callback_query.answer(f"Аккаунт {account_name} удален")
            else:
                await callback_query.answer("Аккаунт не найден")
            await callback_query.message.edit_text("Управление аккаунтами", reply_markup=get_accounts_keyboard())
            return
        
        if waiting_for_account and data != "add_account":
            waiting_for_account = False
            account_name = data
            if re.match(r'^[a-zA-Z0-9_]+$', account_name):
                session_path = os.path.join("sessions", f"{account_name}.session")
                if os.path.exists(session_path):
                    await callback_query.message.edit_text(
                        f"Аккаунт {account_name} уже существует!",
                        reply_markup=get_accounts_keyboard()
                    )
                else:
                    current_account_name = account_name
                    waiting_for_phone = True
                    await callback_query.message.edit_text(
                        f"Введите номер телефона для аккаунта {account_name}\n\nФормат: +71234567890",
                        reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("Отмена", callback_data="menu_accounts")]])
                    )
            else:
                await callback_query.message.edit_text(
                    "Некорректное имя! Используйте только латиницу, цифры и _",
                    reply_markup=get_accounts_keyboard()
                )
            await callback_query.answer()
            return
        
        await callback_query.answer()

async def main():
    init_db()
    
    if not os.path.exists("sessions"):
        os.makedirs("sessions")
    
    global admin_bot
    admin_bot = Client("admin_bot", api_id=API_ID, api_hash=API_HASH, bot_token=TOKEN)
    
    setup_handlers()
    
    await admin_bot.start()
    logger.info("Бот запущен. Напишите /start в Telegram")
    
    try:
        await asyncio.get_event_loop().create_future()
    except asyncio.CancelledError:
        pass
    finally:
        await admin_bot.stop()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Бот остановлен")
