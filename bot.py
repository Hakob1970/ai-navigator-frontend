import requests
import asyncio
import feedparser
import time

from telegram import Update, ReplyKeyboardMarkup
from telegram.ext import Application, CommandHandler, MessageHandler, ContextTypes, filters
from telegram import InlineKeyboardMarkup, InlineKeyboardButton

TOKEN = "8645293983:AAEfUVCWatvE7klR1g1TC6_QBRZm6wdQ1Zc"

BACKEND = "https://ai-navigator-backend-mcb3.onrender.com"

LANG_CACHE = {}

def link_telegram(email, telegram_id):
    try:
        requests.post(
            f"{BACKEND}/api/user/link-telegram",
            json={
                "email": email,
                "telegramId": str(telegram_id)
            }
        )
    except:
        pass

# =========================
# MENU TEXTS
# =========================
TEXTS = {
    "en": {
        "welcome": "Welcome to AI Navigator!",
        "news": "📰 AI News",
        "categories": "📂 Categories",
        "premium": "💎 Premium",
        "discuss": "💬 AI Club"
    },
    "ru": {
        "welcome": "Добро пожаловать в AI Navigator!",
        "news": "📰 AI News",
        "categories": "📂 Categories",
        "premium": "💎 Premium",
        "discuss": "💬 AI Club"
    },
    "am": {
        "welcome": "Բարի գալուստ AI Navigator!",
        "news": "📰 AI News",
        "categories": "📂 Կատեգորիաներ",
        "premium": "💎 Պրեմիում",
        "discuss": "💬 AI Club"
    }

}

# =========================
# BACKEND FUNCTIONS
# =========================
def register_user(user_id, username):
    try:
        requests.post(
            f"{BACKEND}/api/user/register",
            json={"userId": str(user_id), "username": username},
            timeout=3
        )
    except:
        pass


def is_premium(telegram_id):
    try:
        res = requests.get(
            f"{BACKEND}/api/premium/check-telegram",
            params={"telegramId": str(telegram_id)},
            timeout=3
        )

        print("DEBUG STATUS:", res.status_code)
        print("DEBUG RESPONSE:", res.text)

        return res.json().get("premium", False)
    except Exception as e:
        print("ERROR:", e)
        return False


def get_lang(user_id):
    if user_id in LANG_CACHE:
        return LANG_CACHE[user_id]

    try:
        res = requests.get(
            f"{BACKEND}/api/user/lang",
            params={"userId": user_id},
            timeout=3
        )
        lang = res.json().get("language", "en")
        LANG_CACHE[user_id] = lang
        return lang
    except:
        return "en"


def set_language(user_id, username, lang):
    try:
        requests.post(
            f"{BACKEND}/api/user/lang",
            json={
                "userId": str(user_id),
                "username": username,
                "language": lang
            }
        )
    except:
        pass


# =========================
# MENU
# =========================
def menu(lang):
    return ReplyKeyboardMarkup([
        ["📰 AI News"],
        ["📂 Categories"],
        ["💎 Premium"],
        ["💬 AI Club"]
    ], resize_keyboard=True)


# =========================
# START
# =========================
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):

    user_id = update.effective_user.id
    username = update.effective_user.username or "user"

    register_user(user_id, username)

    # 👇 ВАЖНО
    if context.args:
        email = context.args[0]

        requests.post(
            f"{BACKEND}/api/user/link-telegram",
            json={
                "email": email,
                "telegramId": str(user_id)
            },
            timeout=3
        )

    lang = get_lang(user_id)

    await update.message.reply_text(
        TEXTS[lang]["welcome"],
        reply_markup=menu(lang)
    )


# =========================
# HANDLER
# =========================
async def handle(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    username = update.effective_user.username or "user"

    text = update.message.text.strip()
    print("🔥 HANDLE ENTERED")
    print("CLICKED TEXT:", text)
    print("TEXT RECEIVED:", repr(text)) 
    register_user(user_id, username)

    # =========================
    # NEWS
    # =========================
    if "📰 AI News" in text:
        feed = feedparser.parse("https://techcrunch.com/rss")

        for entry in feed.entries[:4]:
            await update.message.reply_text(f"{entry.title}\n{entry.link}")
        return

    # =========================
    # CATEGORIES
    # =========================
    if "📂 Categories" in text:
        await update.message.reply_text(
            "📂 Open categories:\nhttps://ai-navigator-frontend.vercel.app/#categories"
        )
        return

    # =========================
    # PREMIUM    # =========================
    if "💎 Premium" in text:
        premium = is_premium(user_id)

        if premium:
            await update.message.reply_text("💎 You are Premium!")
        else:
            await update.message.reply_text(
                "💎 Premium unlocks:\n\n"
                "• AI tools access\n"
                "• 💬 Join private AI club\n"
                "• 🔒 Exclusive members area\n\n"
                "👉 https://ai-navigator-frontend.vercel.app/#pricing"
            )
        return

    # =========================
    # DISCUSS
    # =========================
    if "💬 AI Club" in text:
        premium = is_premium(user_id)

        if premium:
            keyboard = InlineKeyboardMarkup([
                [InlineKeyboardButton("Open AI Club", url="https://t.me/+UnxQr7zNlrI5Njhi")]
            ])

            await update.message.reply_text(
                "💬 AI Club\n\nWelcome to private AI community 🚀",
                reply_markup=keyboard
            )

        else:
            keyboard = InlineKeyboardMarkup([
                [InlineKeyboardButton("Get Premium", url="https://ai-navigator-frontend.vercel.app/#pricing")]
            ])

            await update.message.reply_text(
                "🔒 AI Club is for Premium users only\n\n"
                "Unlock access to:\n"
                "• Private AI discussions\n"
                "• Exclusive community\n\n"
                "👉 https://ai-navigator-frontend.vercel.app/#pricing",
                reply_markup=keyboard
            )

        return

    # DEFAULT
    await update.message.reply_text("Use the menu 👇")

# =========================
# MAIN
# =========================
def main():
    app = Application.builder().token(TOKEN).build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle))

    print("🤖 Bot running clean version...")
    app.run_polling()


if __name__ == "__main__":
    main()
