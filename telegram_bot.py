import random
import uuid
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup # type: ignore
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes # type: ignore

SERVICES = {
    "Therapy Session": 100,
    "Group Therapy": 50,
    "Online Consultation": 75
}

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    keyboard = [[InlineKeyboardButton(service, callback_data=service)] for service in SERVICES]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text('Please choose a service:', reply_markup=reply_markup)

async def button(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()
    service = query.data
    service_sum = SERVICES[service]
    unique_id = uuid.uuid4()
    link = f"https://joyful-pony-ada784.netlify.app/?id={unique_id}&total_amount={service_sum}"
    await query.edit_message_text(text=f"Selected option: {service}\nLink: {link}")

def main() -> None:
    application = Application.builder().token('7122624893:AAHVjqPhdyN0ieuxVQ_iDCpJuAIiJeZd6TQ').build()

    application.add_handler(CommandHandler('start', start))
    application.add_handler(CallbackQueryHandler(button))

    application.run_polling()

if __name__ == '__main__':
    main()
