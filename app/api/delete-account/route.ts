import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient, SupabaseClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { Resend } from "resend"
import { accountDeletedAdminTemplate } from "@/lib/email/templates/account-deleted-email"

export const dynamic = "force-dynamic"

const resend = new Resend(process.env.RESEND_API_KEY)
const ADMIN_EMAIL = "presupuestaloficial@gmail.com"

interface Profile {
  id: string
  full_name?: string
  phone?: string
  city?: string
  province?: string
  country?: string
  user_type?: string
  subscription_plan?: string
  credits?: number
  created_at: string
}

interface Company {
  id: string
  user_id: string
  company_name?: string
}

async function saveDeletedUserAndNotify(
  supabaseAdmin: SupabaseClient<any, any, any>,
  userId: string,
  userEmail: string,
) {
  try {
    console.log("[v0] [saveDeletedUserAndNotify] Iniciando para:", userId)

    // Obtener datos del perfil antes de eliminar
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle()

    const typedProfile = profile as Profile | null

    if (profileError) console.error("[v0] [saveDeletedUserAndNotify] Error obteniendo perfil:", profileError)

    const { data: companyData } = await supabaseAdmin
      .from("user_company_settings")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle()

    const company = companyData as Company | null

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

    // Contar propuestas recibidas (propietario)
    const { count: quotesReceivedCount } = await supabaseAdmin
      .from("quote_requests")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)

    let userType = typedProfile?.user_type || "propietario"
    if (!userType && (company?.company_name || (quotesSentCount && quotesSentCount > 0))) {
      userType = "profesional"
    }

    const deletedAt = new Date().toISOString()

    // Guardar en tabla deleted_users
    const { error: insertError } = await (supabaseAdmin.from("deleted_users") as any).insert({
      original_user_id: userId,
      email: userEmail,
      full_name: typedProfile?.full_name,
      user_type: userType,
      company_name: company?.company_name,
      phone: typedProfile?.phone,
      city: typedProfile?.city,
      province: typedProfile?.province,
      country: typedProfile?.country,
      subscription_plan: typedProfile?.subscription_plan,
      projects_count: projectsCount || 0,
      quotes_sent_count: quotesSentCount || 0,
      quotes_received_count: quotesReceivedCount || 0,
      credits_remaining: typedProfile?.credits || 0,
      account_created_at: typedProfile?.created_at,
      deleted_at: deletedAt,
    })

    if (insertError) console.error("[v0] Error guardando usuario eliminado:", insertError)

    // Enviar email de notificación
    const formatDate = (date: string | null | undefined) => {
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
      fullName: typedProfile?.full_name || "Sin nombre",
      userType: userType,
      companyName: company?.company_name,
      phone: typedProfile?.phone,
      city: typedProfile?.city,
      province: typedProfile?.province,
      country: typedProfile?.country,
      subscriptionPlan: typedProfile?.subscription_plan,
      projectsCount: projectsCount || 0,
      quotesSentCount: (quotesSentCount as number) || 0,
      quotesReceivedCount: (quotesReceivedCount as number) || 0,
      creditsRemaining: typedProfile?.credits || 0,
      accountCreatedAt: formatDate(typedProfile?.created_at) || undefined,
      deletedAt: formatDate(deletedAt) || deletedAt,
    })

    await resend.emails.send({
      from: "Presupuéstalo <notificaciones@presupuestalo.com>",
      to: [ADMIN_EMAIL],
      subject: `⚠️ Usuario eliminado: ${typedProfile?.full_name || userEmail} (${userType})`,
      html: emailHtml,
    })
  } catch (error) {
    console.error("[v0] Error en saveDeletedUserAndNotify:", error)
  }
}

export async function POST() {
  try {
    const supabase = await createClient()

    if (!supabase) {
      throw new Error("No se pudo inicializar el cliente de Supabase")
    }

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const userId = session.user.id
    const userEmail = session.user.email || ""

    // Paso 1: Validaciones previas
    const { count: activeQuoteRequests } = await supabase
      .from("quote_requests")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "active")

    if (activeQuoteRequests && activeQuoteRequests > 0) {
      return NextResponse.json(
        {
          error: "No puedes eliminar tu cuenta mientras tengas solicitudes activas en el presmarket",
          activeOffersCount: activeQuoteRequests,
          message: `No puedes eliminar tu cuenta porque tienes ${activeQuoteRequests} solicitud(es) activa(s) en el presmarket. Debes esperar a que expiren o cancelarlas.`,
        },
        { status: 400 },
      )
    }

    // Nueva comprobación en lead_requests
    const { data: activeLeads, error: leadError } = await supabase
      .from("lead_requests")
      .select("id, companies_accessed_count")
      .eq("homeowner_id", userId)
      .in("status", ["open", "active"])

    if (activeLeads && activeLeads.length > 0) {
      const hasPurchasedLeads = activeLeads.some(l => (l.companies_accessed_count || 0) > 0)

      if (hasPurchasedLeads) {
        return NextResponse.json(
          {
            error: "No puedes eliminar tu cuenta mientras tengas solicitudes activas adquiridas por profesionales",
            message: "No puedes eliminar tu cuenta porque tienes solicitudes publicadas que ya han sido adquiridas por profesionales. Por motivos de seguridad y transparencia, no puedes eliminar la cuenta hasta que se resuelvan estas solicitudes o pase el tiempo estipulado.",
            activeOffersCount: activeLeads.length,
          },
          { status: 400 },
        )
      } else {
        return NextResponse.json(
          {
            error: "No puedes eliminar tu cuenta mientras tengas solicitudes publicadas",
            message: "No puedes eliminar tu cuenta porque tienes solicitudes activas en el marketplace. Debes eliminarlas primero para poder cerrar tu cuenta.",
            activeOffersCount: activeLeads.length,
          },
          { status: 400 },
        )
      }
    }

    const { count: pendingProposals } = await supabase
      .from("quote_offers")
      .select("id", { count: "exact", head: true })
      .eq("professional_id", userId)
      .eq("status", "sent")

    if (pendingProposals && pendingProposals > 0) {
      return NextResponse.json(
        {
          error: "No puedes eliminar tu cuenta mientras tengas propuestas pendientes",
          pendingProposalsCount: pendingProposals,
          message: `Tienes ${pendingProposals} propuesta(s) pendiente(s).`,
        },
        { status: 400 },
      )
    }

    // Paso 2: Admin Client para procesos de borrado
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log("[v0] [DELETE_ACCOUNT] Guardando backup y notificando...")
    await saveDeletedUserAndNotify(supabaseAdmin, userId, userEmail)

    console.log("[v0] [DELETE_ACCOUNT] Ejecutando RPC de borrado definitivo...")
    const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc("delete_user_and_related_data", {
      user_uuid: userId,
    })

    if (rpcError) {
      console.error("[v0] [DELETE_ACCOUNT] Error RPC:", rpcError)
      return NextResponse.json(
        { error: "Error al ejecutar el borrado en base de datos", details: rpcError },
        { status: 500 },
      )
    }

    if (rpcData && typeof rpcData === 'object' && rpcData.success === false) {
      console.error("[v0] [DELETE_ACCOUNT] RPC devolvió fallo:", rpcData)
      return NextResponse.json(
        { error: rpcData.message || "La función de borrado falló internamente" },
        { status: 500 },
      )
    }

    console.log("[v0] [DELETE_ACCOUNT] Borrado exitoso. Firma de salida...")
    await supabase.auth.signOut()

    return NextResponse.json({
      success: true,
      message: "Cuenta eliminada correctamente",
      data: rpcData,
    })
  } catch (error: any) {
    console.error("[v0] [DELETE_ACCOUNT] Error fatal:", error)
    return NextResponse.json(
      {
        error: error.message || "Error inesperado al eliminar la cuenta",
        details: error,
      },
      { status: 500 },
    )
  }
}
