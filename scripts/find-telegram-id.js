const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

const token = '8572442706:AAGFEqck2FNtlx2uPTAZxmjgfeRhoMQ-EoU';
const bot = new TelegramBot(token, { polling: true });

console.log("--- BUSCADOR DE ID DE GRUPO (MODO ARCHIVO) ---");
console.log("Esperando mensaje en el grupo...");

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const type = msg.chat.type;
    const title = msg.chat.title;

    if (type === 'group' || type === 'supergroup') {
        const output = `ID: ${chatId}\nNombre: ${title}\nTipo: ${type}`;
        fs.writeFileSync('group_id.txt', output);
        console.log("✅ ¡ID CAPTURADO! Guardado en group_id.txt");
        process.exit(0);
    } else {
        console.log(`[Ignorado: Mensaje privado de ${msg.from.username}]`);
    }
});
