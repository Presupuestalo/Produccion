import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { Resend } from "resend"
import { accountDeletedAdminTemplate } from "@/lib/email/templates/account-deleted-email"

export const dynamic = "force-dynamic"

const resend = new Resend(process.env.RESEND_API_KEY)
const ADMIN_EMAIL = "presupuestaloficial@gmail.com"

async function saveDeletedUserAndNotify(
  supabaseAdmin: ReturnType<typeof createAdminClient>,
  userId: string,
  userEmail: string,
) {
  try {
    // Obtener datos del perfil antes de eliminar
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()

    console.log("[v0] === DELETE ACCOUNT DEBUG ===")
    console.log("[v0] User ID:", userId)
    console.log("[v0] Profile error:", profileError)
    console.log("[v0] Profile user_type raw:", profile?.user_type)
    console.log("[v0] Profile full:", JSON.stringify(profile, null, 2))

    const { data: company, error: companyError } = await supabaseAdmin
      .from("user_company_settings")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle()

    console.log("[v0] Company data:", company)
    console.log("[v0] Company error:", companyError)
    console.log("[v0] Company name:", company?.company_name)

    // Contar proyectos
    const { count: projectsCount } = await supabaseAdmin
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)

    // Contar propuestas enviadas (profesional)
    const { count: quotesSentCount } = await supabaseAdmin
      .from("quote_offers")
      .select("*", { count: "exact", head: true })
      .eq("professional_id", userId)

    console.log("[v0] Quotes sent count:", quotesSentCount)

    // Contar propuestas recibidas (propietario)
    const { count: quotesReceivedCount } = await supabaseAdmin
      .from("quote_requests")
      .select("id, quote_offers(id)", { count: "exact", head: true })
      .eq("user_id", userId)

    let userType: string | null = null

    // 1. Primero intentar desde el perfil
    if (profile?.user_type && profile.user_type !== "") {
      userType = profile.user_type
      console.log("[v0] User type from profile:", userType)
    }

    // 2. Si tiene empresa configurada, es profesional
    if (!userType && company && company.company_name) {
      userType = "profesional"
      console.log("[v0] User type inferred from company:", userType)
    }

    // 3. Si envió propuestas, es profesional
    if (!userType && quotesSentCount && quotesSentCount > 0) {
      userType = "profesional"
      console.log("[v0] User type inferred from quotes sent:", userType)
    }

    // 4. Default a propietario solo si no se pudo determinar
    if (!userType) {
      userType = "propietario"
      console.log("[v0] User type defaulted to propietario")
    }

    console.log("[v0] === FINAL USER TYPE ===:", userType)

    const deletedAt = new Date().toISOString()

    // Guardar en tabla deleted_users
    const { error: insertError } = await supabaseAdmin.from("deleted_users").insert({
      original_user_id: userId,
      email: userEmail,
      full_name: profile?.full_name,
      user_type: userType,
      company_name: company?.company_name,
      phone: profile?.phone,
      city: profile?.city,
      province: profile?.province,
      country: profile?.country,
      subscription_plan: profile?.subscription_plan,
      projects_count: projectsCount || 0,
      quotes_sent_count: quotesSentCount || 0,
      quotes_received_count: quotesReceivedCount || 0,
      credits_remaining: profile?.credits || 0,
      account_created_at: profile?.created_at,
      deleted_at: deletedAt,
      additional_data: {
        profile,
        company,
      },
    })

    if (insertError) {
      console.error("[v0] Error guardando usuario eliminado:", insertError)
    } else {
      console.log("[v0] Usuario eliminado guardado en tabla deleted_users")
    }

    // Enviar email de notificación
    const formatDate = (date: string | null) => {
      if (!date) return null
      return new Date(date).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    }

    const emailHtml = accountDeletedAdminTemplate({
      email: userEmail,
      fullName: profile?.full_name || "Sin nombre",
      userType: userType,
      companyName: company?.company_name,
      phone: profile?.phone,
      city: profile?.city,
      province: profile?.province,
      country: profile?.country,
      subscriptionPlan: profile?.subscription_plan,
      projectsCount: projectsCount || 0,
      quotesSentCount: quotesSentCount || 0,
      quotesReceivedCount: quotesReceivedCount || 0,
      creditsRemaining: profile?.credits || 0,
      accountCreatedAt: formatDate(profile?.created_at),
      deletedAt: formatDate(deletedAt) || deletedAt,
    })

    console.log("[v0] Sending email with userType:", userType)

    const { error: emailError } = await resend.emails.send({
      from: "Presupuéstalo <notificaciones@presupuestalo.com>",
      to: [ADMIN_EMAIL],
      subject: `⚠️ Usuario eliminado: ${profile?.full_name || userEmail} (${userType})`,
      html: emailHtml,
    })

    if (emailError) {
      console.error("[v0] Error enviando email de notificación:", emailError)
    } else {
      console.log("[v0] Email de notificación enviado a", ADMIN_EMAIL)
    }
  } catch (error) {
    console.error("[v0] Error en saveDeletedUserAndNotify:", error)
  }
}

export async function POST() {
  try {
    const supabase = await createClient()

    // Verificar sesión
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const userId = session.user.id
    const userEmail = session.user.email || ""

    console.log("[v0] Iniciando eliminación de cuenta para usuario:", userId)

    // Verificar si tiene solicitudes activas en el presmarket (propietario)
    const { data: activeQuoteRequests, error: quoteError } = await supabase
      .from("quote_requests")
      .select("id, status")
      .eq("user_id", userId)
      .eq("status", "active")

    if (quoteError) {
      console.error("[v0] Error al verificar ofertas activas:", quoteError)
    } else if (activeQuoteRequests && activeQuoteRequests.length > 0) {
      return NextResponse.json(
        {
          error: "No puedes eliminar tu cuenta mientras tengas solicitudes activas en el presmarket",
          activeOffersCount: activeQuoteRequests.length,
          message: `Tienes ${activeQuoteRequests.length} solicitud(es) activa(s) en el presmarket. Los profesionales han pagado créditos para acceder a tu información. Debes esperar a que expiren antes de eliminar tu cuenta.`,
        },
        { status: 400 },
      )
    }

    // Verificar propuestas pendientes (profesional)
    const { data: pendingProposals, error: proposalsError } = await supabase
      .from("quote_offers")
      .select("id, status")
      .eq("professional_id", userId)
      .eq("status", "sent")

    if (proposalsError) {
      console.error("[v0] Error al verificar propuestas pendientes:", proposalsError)
    } else if (pendingProposals && pendingProposals.length > 0) {
      return NextResponse.json(
        {
          error: "No puedes eliminar tu cuenta mientras tengas propuestas pendientes",
          pendingProposalsCount: pendingProposals.length,
          message: `Tienes ${pendingProposals.length} propuesta(s) pendiente(s) de respuesta. Debes esperar a que el propietario las acepte o rechace.`,
        },
        { status: 400 },
      )
    }

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    await saveDeletedUserAndNotify(supabaseAdmin, userId, userEmail)

    const { data, error } = await supabase.rpc("delete_user_and_related_data", {
      user_uuid: userId,
    })

    console.log("[v0] Respuesta de RPC:", { data, error })

    if (error) {
      console.error("[v0] Error RPC al eliminar usuario:", error)
      return NextResponse.json(
        {
          error: error.message || "Error al eliminar la cuenta",
          details: error,
        },
        { status: 500 },
      )
    }

    if (data && typeof data === "object" && data.success === false) {
      console.error("[v0] La función SQL retornó error:", data)
      return NextResponse.json(
        {
          error: data.message || data.error || "Error al eliminar la cuenta",
          details: data,
        },
        { status: 500 },
      )
    }

    console.log("[v0] Datos eliminados correctamente:", data)

    // Cerrar sesión
    await supabase.auth.signOut()

    console.log("[v0] Cuenta eliminada exitosamente:", userId)

    return NextResponse.json({
      success: true,
      message: "Cuenta eliminada correctamente",
      data,
    })
  } catch (error: any) {
    console.error("[v0] Error inesperado al eliminar cuenta:", error)
    return NextResponse.json(
      {
        error: error.message || "Error inesperado",
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Verificar que el usuario está autenticado y es el mismo que intenta eliminar
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session || session.user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userEmail = session.user.email || ""

    console.log("[v0] Iniciando eliminación de cuenta para usuario:", userId)

    // Verificar si tiene solicitudes activas en el presmarket (propietario)
    const { data: activeQuoteRequests, error: quoteError } = await supabase
      .from("quote_requests")
      .select("id, status")
      .eq("user_id", userId)
      .eq("status", "active")

    if (quoteError) {
      console.error("[v0] Error al verificar ofertas activas:", quoteError)
    } else if (activeQuoteRequests && activeQuoteRequests.length > 0) {
      return NextResponse.json(
        {
          error: "No puedes eliminar tu cuenta mientras tengas solicitudes activas en el presmarket",
          activeOffersCount: activeQuoteRequests.length,
          message: `Tienes ${activeQuoteRequests.length} solicitud(es) activa(s) en el presmarket. Los profesionales han pagado créditos para acceder a tu información. Debes esperar a que expiren antes de eliminar tu cuenta.`,
        },
        { status: 400 },
      )
    }

    // Verificar propuestas pendientes (profesional)
    const { data: pendingProposals, error: proposalsError } = await supabase
      .from("quote_offers")
      .select("id, status")
      .eq("professional_id", userId)
      .eq("status", "sent")

    if (proposalsError) {
      console.error("[v0] Error al verificar propuestas pendientes:", proposalsError)
    } else if (pendingProposals && pendingProposals.length > 0) {
      return NextResponse.json(
        {
          error: "No puedes eliminar tu cuenta mientras tengas propuestas pendientes",
          pendingProposalsCount: pendingProposals.length,
          message: `Tienes ${pendingProposals.length} propuesta(s) pendiente(s) de respuesta. Debes esperar a que el propietario las acepte o rechace.`,
        },
        { status: 400 },
      )
    }

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    await saveDeletedUserAndNotify(supabaseAdmin, userId, userEmail)

    // Usar la función SQL robusta
    const { data, error } = await supabase.rpc("delete_user_and_related_data", {
      user_uuid: userId,
    })

    if (error) {
      console.error("[v0] Error al eliminar usuario:", error)
      return NextResponse.json({ error: "Error al eliminar cuenta" }, { status: 500 })
    }

    await supabase.auth.signOut()

    console.log("[v0] Cuenta eliminada exitosamente:", userId)

    return NextResponse.json({ success: true, message: "Cuenta eliminada exitosamente", data })
  } catch (error: any) {
    console.error("[v0] Error al eliminar cuenta:", error)
    return NextResponse.json({ error: error.message || "Error al eliminar cuenta" }, { status: 500 })
  }
}
