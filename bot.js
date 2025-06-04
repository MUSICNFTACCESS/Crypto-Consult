const TelegramBot = require('node-telegram-bot-api');
const token = '7590185158:AAG3XXguqLO6WP5s9cMx0bdFKnHUZLrqt7Q';
const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const welcomeText = `Welcome to CryptoConsult by Crimzn!

Tap the Start button above or the Menu button to launch the app and begin your personalized crypto journey.`;
  bot.sendMessage(chatId, welcomeText);
});
