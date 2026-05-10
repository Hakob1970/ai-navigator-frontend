import requests
import asyncio
import feedparser
import time

from telegram import Update, ReplyKeyboardMarkup
from telegram.ext import Application, CommandHandler, MessageHandler, ContextTypes, filters
from telegram import InlineKeyboardMarkup, InlineKeyboardButton

TOKEN = "8645293983:AAEfUVCWatvE7klR1g1TC6_QBRZm6wdQ1Zc"

BACKEND = "https://ai-navigator-backend-mcb3.onrender.com"

email_cache = {}

def link_telegram(email, telegram_id):
    try:
        requests.post(
            f"{BACKEND}/api/user/link-telegram",
            json={
                "email": email,
                "telegramId": str(telegram_id)
            },
            timeout=3
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
        "discuss": "💬 Discussion Club"
    },
    "ru": {
        "welcome": "Добро пожаловать в AI Navigator!",
        "news": "📰 AI News",
        "categories": "📂 Categories",
        "premium": "💎 Premium",
        "discuss": "💬 Discussion Club"
    },
    "am": {
        "welcome": "Բարի գալուստ AI Navigator!",
        "news": "📰 AI News",
        "categories": "📂 Կատեգորիաներ",
        "premium": "💎 Պրեմիում",
        "discuss": "💬 Discussion Club"
    }

}


# =========================
# BACKEND FUNCTIONS
# =========================

def register_user(user_id, username):
    try:
        requests.post(f"{BACKEND}/api/user/register",
            json={"userId": str(user_id), "username": username},
            timeout=3
        )
    except:
        pass


def get_email(user_id):
    try:
        res = requests.get(
            f"{BACKEND}/api/user/get-email",
            params={"telegramId": user_id},
            timeout=3
        )
        return res.json().get("email")
    except:
        return None


def get_lang(user_id):
    try:
        res = requests.get(
            f"{BACKEND}/api/user/lang",
            params={"userId": user_id},
            timeout=3
        )
        return res.json().get("language", "en")
    except:
        return "en"

def is_premium(email):
    try:
        res = requests.get(
            f"{BACKEND}/api/premium/check",
            params={"userId": email},
            timeout=3
        )
        return res.json().get("premium", False)
    except:
        return False

# =========================
# MENU
# =========================
def menu(lang):
    return ReplyKeyboardMarkup([
        ["📰 AI News"],
        ["💬 Discussion Club"]
    ], resize_keyboard=True,
       is_persistent=True)

async def show_menu(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    lang = get_lang(user_id)

    await update.message.reply_text(
        "Menu",
        reply_markup=menu(lang)
    )


# =========================
# START
# =========================
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):

    user_id = update.effective_user.id
    username = update.effective_user.username or "user"

    register_user(user_id, username)

    # 👇 ВАЖНО
    if context.args:
        email = context.args[0].strip().lower()

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
    email = get_email(user_id)
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
    # DISCUSS
    # =========================
    if "💬 Discussion Club" in text:

        email = get_email(user_id)
        premium = is_premium(email) if email else False

        print("DISCUSSION CLUB TELEGRAM ID:", user_id)
        print("DISCUSSION CLUB EMAIL:", email)
        print("DISCUSSION CLUB PREMIUM:", premium)

        if premium:
            keyboard = InlineKeyboardMarkup([
                [InlineKeyboardButton("Open Discussion Club", url="https://t.me/+UnxQr7zNlrI5Njhi")]
            ])

            await update.message.reply_text(
                "💬 Discussion Club\n\nWelcome to the private AI community 🚀",
                reply_markup=keyboard
            )

        else:
            keyboard = InlineKeyboardMarkup([
                [InlineKeyboardButton("Get Premium", url=f"https://ai-navigator-frontend.vercel.app/?tg={user_id}#pricing")]
            ])

            await update.message.reply_text(
                "🔒 Discussion Club is for Premium users only\n\n"
                f"👉 https://ai-navigator-frontend.vercel.app/?tg={user_id}#pricing",
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

    app.add_handler(CommandHandler("menu", show_menu))
    app.add_handler(CommandHandler("start", start))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle))

    print("🤖 Bot running clean version...")
    app.run_polling()


if __name__ == "__main__":
    main()
