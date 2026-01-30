const https = require('https');

const token = '8572442706:AAGFEqck2FNtlx2uPTAZxmjgfeRhoMQ-EoU';
const url = `https://api.telegram.org/bot${token}/getWebhookInfo`;

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        console.log("--- ESTADO DEL WEBHOOK ---");
        const info = JSON.parse(data);
        console.log(JSON.stringify(info, null, 2));

        if (!info.result.url) {
            console.log("\n❌ ALERTA: NO HAY WEBHOOK CONFIGURADO.");
            console.log("El script de búsqueda lo desactivó (es normal). Hay que reactivarlo.");
        } else {
            console.log(`\n✅ Webhook activo apuntando a: ${info.result.url}`);
        }
    });
}).on('error', (err) => {
    console.error("Error:", err.message);
});
