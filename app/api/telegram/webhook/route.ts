import { NextResponse } from "next/server"
import TelegramBot from "node-telegram-bot-api"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

const token = process.env.TELEGRAM_BOT_TOKEN

// Initialize bot only if token exists
const bot = token ? new TelegramBot(token) : null

// IMPORTANT: Set this to your actual Group ID if you have it hardcoded,
// otherwise we might need to store it in DB or ask user to provide it.
// For now, we'll try to find it dynamically or use a placeholder.
// The user has NOT provided the Chat ID yet. We can fail gracefully or just log it.
// We will try to fetch it from environment if added later.
const GROUP_CHAT_ID = process.env.TELEGRAM_GROUP_ID

export async function POST(req: Request) {
    if (!bot) {
        return NextResponse.json({ error: "Bot token not configured" }, { status: 500 })
    }

    try {
        const update = await req.json()
        const message = update.message

        if (message?.text?.startsWith("/start")) {
            const chatId = message.chat.id
            const telegramUserId = message.from?.id
            const username = message.from?.username

            // Extract the UUID payload (e.g. "/start 123e4567-e89b...")
            const args = message.text.split(" ")
            const payloadUserId = args.length > 1 ? args[1] : null

            if (!payloadUserId) {
                await bot.sendMessage(chatId, "Hola. Para vincular tu cuenta, por favor usa el enlace desde el panel de usuario en Presupuéstalo.")
                return NextResponse.json({ ok: true })
            }

            // Check if user exists and is subscribed
            const { data: profile } = await supabaseAdmin
                .from("profiles")
                .select("id, subscription_plan, full_name")
                .eq("id", payloadUserId)
                .single()

            if (!profile) {
                await bot.sendMessage(chatId, "No hemos podido encontrar tu usuario. Por favor verifica tu cuenta.")
                return NextResponse.json({ ok: true })
            }

            const isSubscribed = profile.subscription_plan === "basic" || profile.subscription_plan === "pro"

            if (!isSubscribed) {
                await bot.sendMessage(chatId, "Parece que no tienes una suscripción activa. Suscríbete para acceder al grupo VIP.")
                return NextResponse.json({ ok: true })
            }

            // Update Profile with Telegram ID
            await supabaseAdmin.from("profiles").update({
                telegram_user_id: telegramUserId,
                telegram_username: username
            }).eq("id", payloadUserId)

            await bot.sendMessage(chatId, `¡Cuenta vinculada correctamente! Hola ${profile.full_name || "Usuario"}.`)

            if (GROUP_CHAT_ID) {
                try {
                    // Generate single-use invite link
                    const link = await bot.createChatInviteLink(GROUP_CHAT_ID, {
                        member_limit: 1,
                        name: `Invitación para ${username || payloadUserId}`
                    })
                    await bot.sendMessage(chatId, `Aquí tienes tu enlace de acceso único para el grupo VIP:\n${link.invite_link}`)
                } catch (err: any) {
                    console.error("Failed to generate invite link:", err)
                    await bot.sendMessage(chatId, "Hubo un error generando tu enlace de invitación. Por favor contacta soporte.")
                }
            } else {
                await bot.sendMessage(chatId, "Tu cuenta está vinculada, pero el grupo aún no está configurado. Te avisaremos pronto.")
            }
        }

        return NextResponse.json({ ok: true })
    } catch (error: any) {
        console.error("Telegram Webhook Error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
