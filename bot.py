import requests
import asyncio
import feedparser
import time

from telegram import Update, ReplyKeyboardMarkup
from telegram.ext import Application, CommandHandler, MessageHandler, ContextTypes, filters
from telegram import InlineKeyboardMarkup, InlineKeyboardButton

TOKEN = "8645293983:AAEfUVCWatvE7klR1g1TC6_QBRZm6wdQ1Zc"

# =========================
# BACKEND
# =========================
BACKEND = "http://localhost:3000"

# =========================
# STATE
# =========================
user_states = {}
last_request = {}

# =========================
# MENU TEXTS
# =========================
TEXTS = {
    "en": {
        "welcome": "Welcome to AI Navigator!",
        "news": "📰 AI News",
        "categories": "📂 Categories",
        "premium": "💎 Premium",
        "discuss": "💬 Discuss"
    },
    "ru": {
        "welcome": "Добро пожаловать в AI Navigator!",
        "news": "📰 AI News",
        "categories": "📂 Categories",
        "premium": "💎 Premium",
        "discuss": "💬 Discuss"
    },
    "am": {
        "welcome": "Բարի գալուստ AI Navigator!",
        "news": "📰 AI News",
        "categories": "📂 Կատեգորիաներ",
        "premium": "💎 Պրեմիում",
        "discuss": "💬 Discuss"
    }

}

# =========================
# BACKEND FUNCTIONS
# =========================
def register_user(user_id, username):
    try:
        requests.post(
            f"{BACKEND}/api/user/register",
            json={"userId": str(user_id), "username": username}
        )
    except:
        pass


def is_premium(user_id):
    try:
        res = requests.get(f"{BACKEND}/api/premium/check?userId={user_id}")
        return res.json().get("premium", False)
    except:
        return False


def get_lang(user_id):
    try:
        res = requests.get(f"{BACKEND}/api/user/lang?userId={user_id}")
        return res.json().get("language", "en")
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
        ["💬 Discuss"]
    ], resize_keyboard=True)


# =========================
# START
# =========================
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    username = update.effective_user.username or "user"

    register_user(user_id, username)

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

    register_user(user_id, username)

    # =========================
    # NEWS
    # =========================
    if text == "📰 AI News":
        feed = feedparser.parse("https://techcrunch.com/rss")

        for entry in feed.entries[:4]:
            await update.message.reply_text(f"{entry.title}\n{entry.link}")
        return

    # =========================
    # CATEGORIES
    # =========================
    if text == "📂 Categories":
        await update.message.reply_text(
            "📂 Open categories:\nhttps://ai-navigator-frontend.vercel.app/#categories"
        )
        return

    # =========================
    # PREMIUM
    # =========================
    if text == "💎 Premium":
        premium = is_premium(user_id)

        if premium:
            await update.message.reply_text("💎 You are Premium!")
        else:
            await update.message.reply_text(
                "💎 Get Premium:\nhttps://ai-navigator-frontend.vercel.app/#pricing"
            )
        return

    # =========================
    # DISCUSS
    # =========================
    if text == "💬 Discuss":
        premium = is_premium(user_id)

        if premium:
            keyboard = InlineKeyboardMarkup([
                [InlineKeyboardButton("Open Discuss", url="https://t.me/your_channel")]
            ])

            await update.message.reply_text("🚀 Join Discuss:", reply_markup=keyboard)

        else:
            keyboard = InlineKeyboardMarkup([
                [InlineKeyboardButton("Get Premium", url="https://ai-navigator-frontend.vercel.app/#pricing")]
            ])

            await update.message.reply_text(
                "🔒 Discuss is available for Premium users.",
                reply_markup=keyboard
            )
        return

    # DEFAULT
    await update.message.reply_text("Use the menu 👇")


# =========================
# PREMIUM COMMAND
# =========================
async def give_premium(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id

    try:
        res = requests.post(
            f"{BACKEND}/api/premium/activate",
            json={"userId": str(user_id)}
        )

        if res.status_code == 200:
            await update.message.reply_text("💎 Premium activated via backend!")
        else:
            await update.message.reply_text("❌ Error")
    except:
        await update.message.reply_text("❌ Backend not reachable")



# =========================
# MAIN
# =========================
def main():
    app = Application.builder().token(TOKEN).build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("premium", give_premium))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle))

    print("🤖 Bot running clean version...")
    app.run_polling()


if __name__ == "__main__":
    main()
