export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function POST(request: Request) {
  try {
    const { email, name } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email es requerido" }, { status: 400 })
    }

    console.log("[v0] 🔍 Generando código OTP para:", email)

    const { data: existingUsers, error: checkError } = await supabaseAdmin.auth.admin.listUsers()

    if (!checkError && existingUsers) {
      const userExists = existingUsers.users.some((user) => user.email === email)

      if (userExists) {
        console.log("[v0] ⚠️ Usuario ya existe:", email)
        return NextResponse.json(
          {
            error:
              "Este email ya está registrado. Si te registraste con Google, intenta iniciar sesión con tu cuenta de Gmail.",
            code: "email_exists",
          },
          { status: 409 },
        )
      }
    }

    // Generar código aleatorio de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    console.log("[v0] ✅ Código generado:", code)

    // Eliminar códigos antiguos del mismo email
    await supabaseAdmin.from("email_verification_codes").delete().eq("email", email)

    // Guardar código en la base de datos (expira en 10 minutos)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    const { error: insertError } = await supabaseAdmin.from("email_verification_codes").insert({
      email,
      code,
      expires_at: expiresAt,
      verified: false,
    })

    if (insertError) {
      console.error("[v0] ❌ Error al guardar código:", insertError)
      throw new Error("Error al guardar código de verificación")
    }

    const isDevelopment = process.env.NODE_ENV === "development"
    const resendApiKey = process.env.RESEND_API_KEY

    if (!resendApiKey) {
      console.error("[v0] ❌ RESEND_API_KEY no configurada")
      if (isDevelopment) {
        return NextResponse.json({
          success: true,
          message: "Código de verificación generado (modo desarrollo)",
          devMode: true,
          code: code,
        })
      }
      return NextResponse.json({ error: "Servicio de email no configurado" }, { status: 500 })
    }

    const emailPayload = {
      from: "Presupuéstalo <noreply@presupuestalo.com>",
      to: email,
      subject: "Tu código de verificación - Presupuéstalo",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #ea580c; margin: 0;">Presupuéstalo</h1>
          </div>
          
          <h2 style="color: #1f2937; margin-bottom: 20px;">¡Hola${name ? ` ${name}` : ""}!</h2>
          
          <p style="color: #4b5563; line-height: 1.6; margin-bottom: 30px;">
            Gracias por registrarte en Presupuéstalo. Para verificar tu dirección de email, 
            introduce el siguiente código de 6 dígitos en la aplicación:
          </p>
          
          <div style="background-color: #f3f4f6; padding: 30px; border-radius: 12px; text-align: center; margin: 30px 0;">
            <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #ea580c; font-family: 'Courier New', monospace;">
              ${code}
            </div>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Este código expirará en 10 minutos por seguridad.
          </p>
          
          <p style="color: #6b7280; font-size: 14px;">
            Si no solicitaste este código, puedes ignorar este mensaje.
          </p>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} Presupuéstalo. Todos los derechos reservados.
            </p>
          </div>
        </div>
      `,
    }

    try {
      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify(emailPayload),
      })

      if (!resendResponse.ok) {
        if (isDevelopment) {
          return NextResponse.json({
            success: true,
            code: code,
            devMode: true,
          })
        }
        throw new Error("Error al enviar email de verificación")
      }
    } catch (emailError: any) {
      if (isDevelopment) {
        return NextResponse.json({
          success: true,
          code: code,
          devMode: true,
        })
      }
      throw emailError
    }

    return NextResponse.json({
      success: true,
      message: "Código de verificación enviado",
      emailSent: true,
    })
  } catch (error: any) {
    console.error("[v0] 💥 Error en send-verification-code:", error)
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
  }
}
