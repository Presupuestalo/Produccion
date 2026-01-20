import { createClient } from "@/lib/supabase/server"
import { NextResponse, type NextRequest } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    // Crear cliente de Supabase con la clave de servicio para acceder a funciones administrativas
    const supabase = await createClient()

    const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`

    // Configurar las URLs de redirección para los diferentes tipos de emails
    const redirectUrls = {
      confirmationRedirectUrl: `${baseUrl}/auth/verification`,
      recoveryRedirectUrl: `${baseUrl}/auth/reset-password`,
      emailChangeRedirectUrl: `${baseUrl}/auth/confirm-email-change`,
    }

    // Aquí normalmente usaríamos la API administrativa de Supabase para actualizar las plantillas
    // Pero como no tenemos acceso directo a esa API desde el cliente, mostramos instrucciones

    return NextResponse.json({
      success: true,
      message: "Instrucciones para configurar plantillas de email",
      instructions: [
        "1. Ve al Dashboard de Supabase > Authentication > Email Templates",
        "2. Configura las siguientes URLs de redirección:",
        `   - Confirmation: ${redirectUrls.confirmationRedirectUrl}`,
        `   - Recovery: ${redirectUrls.recoveryRedirectUrl}`,
        `   - Email Change: ${redirectUrls.emailChangeRedirectUrl}`,
        "3. Guarda los cambios",
      ],
      redirectUrls,
    })
  } catch (error: any) {
    console.error("Error al configurar plantillas de email:", error)
    return NextResponse.json({ error: error.message || "Error al configurar plantillas de email" }, { status: 500 })
  }
}
