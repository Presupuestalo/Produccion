
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config({ path: '.env.local' });

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
    console.error("No TELEGRAM_BOT_TOKEN found in .env.local");
    process.exit(1);
}

const bot = new TelegramBot(token);



const fs = require('fs');
bot.getMe().then((me) => {
    fs.writeFileSync('bot-info.json', JSON.stringify(me, null, 2));
    console.log("Written to bot-info.json");
}).catch((err) => {


    console.error("Error fetching bot info:", err.message);
});
