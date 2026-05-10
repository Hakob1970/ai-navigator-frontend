import os
import json
import time

from telegram import Update
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    ContextTypes,
    filters
)

TOKEN = os.environ["SUPPORT_BOT_TOKEN"]
ADMIN_ID = int(os.environ["SUPPORT_ADMIN_ID"])

# -----------------------------
# Persistent reply mapping
# -----------------------------
reply_map = {}

MAP_FILE = "reply_map.json"


def load_map():
    global reply_map
    try:
        with open(MAP_FILE, "r") as f:
            reply_map = json.load(f)
    except:
        reply_map = {}


def save_map():
    with open(MAP_FILE, "w") as f:
        json.dump(reply_map, f)


# -----------------------------
# Anti spam
# -----------------------------
last_message_at = {}


# -----------------------------
# USER START
# -----------------------------
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "AI Navigator Support\n\n"
        "Write your issue here and we will reply soon."
    )


# -----------------------------
# USER MESSAGE → ADMIN
# -----------------------------
async def handle_user_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    message = update.message

    text = message.text or ""

    # anti-spam
    now = time.time()
    if now - last_message_at.get(user.id, 0) < 5:
        await message.reply_text("Wait a few seconds before sending again.")
        return

    last_message_at[user.id] = now

    if len(text.strip()) < 3:
        await message.reply_text("Please describe your issue.")
        return

    username = f"@{user.username}" if user.username else "No username"

    admin_text = (
        "📩 NEW SUPPORT MESSAGE\n\n"
        f"User ID: {user.id}\n"
        f"Username: {username}\n"
        f"Name: {user.full_name}\n\n"
        f"Message:\n{text}\n\n"
        "↩ Reply to this message to answer user."
    )

    sent = await context.bot.send_message(
        chat_id=ADMIN_ID,
        text=admin_text
    )

    # save mapping (message_id -> user_id)
    reply_map[str(sent.message_id)] = user.id
    save_map()

    await message.reply_text("✅ Sent to support team.")


# -----------------------------
# ADMIN REPLY → USER
# -----------------------------
async def handle_admin_reply(update: Update, context: ContextTypes.DEFAULT_TYPE):
    message = update.message

    if not message.reply_to_message:
        await message.reply_text("⚠️ Reply to a support message.")
        return

    replied_id = str(message.reply_to_message.message_id)

    user_id = reply_map.get(replied_id)

    if not user_id:
        await message.reply_text("❌ Cannot find user for this message.")
        return

    text = message.text or ""

    await context.bot.send_message(
        chat_id=user_id,
        text=f"💬 Support Reply:\n\n{text}"
    )

    await message.reply_text("✅ Sent to user.")


# -----------------------------
# MAIN
# -----------------------------
def main():
    load_map()

    app = Application.builder().token(TOKEN).build()

    app.add_handler(CommandHandler("start", start))

    # USER messages (everyone except admin)
    app.add_handler(
        MessageHandler(
            filters.TEXT & ~filters.COMMAND & ~filters.User(ADMIN_ID),
            handle_user_message
        )
    )

    # ADMIN messages ONLY
    app.add_handler(
        MessageHandler(
            filters.TEXT & filters.User(ADMIN_ID),
            handle_admin_reply
        )
    )

    print("Support bot running...")
    app.run_polling()


if __name__ == "__main__":
    main()
