const TelegramBot = require('node-telegram-bot-api');

// Hardcoded for testing script only
const token = '8572442706:AAGFEqck2FNtlx2uPTAZxmjgfeRhoMQ-EoU';
const groupId = '-3102727408';

const bot = new TelegramBot(token, { polling: false });

async function testPermissions() {
    console.log("--- Iniciando Diagnóstico de Telegram ---");
    console.log(`Bot Token: ${token.substring(0, 10)}...`);
    console.log(`Group ID: ${groupId}`);

    try {
        // 1. Verificar Bot
        const me = await bot.getMe();
        console.log(`✅ Conectado como: @${me.username} (ID: ${me.id})`);

        // 2. Verificar Acceso al Grupo
        console.log("Intentando obtener información del grupo...");
        const chat = await bot.getChat(groupId);
        console.log(`✅ Grupo encontrado: "${chat.title}" (${chat.type})`);

        // 3. Verificar Administradores
        console.log("Verificando administradores...");
        const admins = await bot.getChatAdministrators(groupId);
        const botAdmin = admins.find(a => a.user.id === me.id);

        if (botAdmin) {
            console.log(`✅ El bot ES administrador.`);
            console.log(`   Permisos:`, JSON.stringify(botAdmin.status === 'creator' ? 'creator' : botAdmin, null, 2));

            if (botAdmin.status !== 'creator' && !botAdmin.can_invite_users) {
                console.error("❌ ERROR CRÍTICO: El bot es admin pero NO TIENE PERMISO para 'Invitar usuarios con enlace' (can_invite_users).");
            }
        } else {
            console.error("❌ ERROR CRÍTICO: El bot NO aparece en la lista de administradores.");
        }

        // 4. Intentar crear enlace
        console.log("Intentando crear enlace de prueba...");
        const link = await bot.createChatInviteLink(groupId, {
            member_limit: 1,
            name: "Test Script Debug"
        });
        console.log(`✅ ÉXITO TOTAL: Enlace generado: ${link.invite_link}`);
        console.log("Si ves esto, la configuración ES CORRECTA y el problema está solo en el despliegue de Vercel.");

    } catch (error) {
        console.error("\n❌ FALLO EL DIAGNÓSTICO:");
        console.error(`Código de error: ${error.code}`);
        console.error(`Mensaje: ${error.message}`);

        if (error.response && error.response.body) {
            console.error("Detalles Telegram:", error.response.body);
        }

        if (error.message.includes("chat not found")) {
            console.error("👉 CAUSA PROBABLE: El ID del grupo es incorrecto o el bot no ha sido añadido al grupo.");
        } else if (error.message.includes("Not enough rights")) {
            console.error("👉 CAUSA PROBABLE: El bot está en el grupo pero NO es Admin o le faltan permisos de invitar.");
        }
    }
}

testPermissions();
