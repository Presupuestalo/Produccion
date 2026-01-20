import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendEmail, sendAdminEmail } from "@/lib/email/send-email"
import { emailClaimReceived, emailAdminNewClaim } from "@/lib/email/templates/presmarket-emails"

export const dynamic = "force-dynamic"

// POST - Crear una nueva reclamación
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const {
      leadInteractionId,
      leadRequestId,
      leadTitle,
      leadCity,
      reason,
      reasonDetails,
      callAttempts,
      callDates,
      whatsappSent,
      smsSent,
      emailSent,
      creditsSpent,
    } = body

    // Validar campos requeridos
    if (!leadInteractionId || !reason || !creditsSpent) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    // Verificar que la interacción existe y pertenece al usuario
    const { data: interaction, error: interactionError } = await supabase
      .from("lead_interactions")
      .select("*")
      .eq("id", leadInteractionId)
      .eq("company_id", user.id)
      .single()

    if (interactionError || !interaction) {
      return NextResponse.json({ error: "Interacción no encontrada" }, { status: 404 })
    }

    // Verificar que no haya pasado más de 7 días desde la compra
    const purchaseDate = new Date(interaction.created_at)
    const now = new Date()
    const daysSincePurchase = Math.floor((now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24))

    if (daysSincePurchase > 7) {
      return NextResponse.json(
        {
          error: "El plazo para reclamar ha expirado (máximo 7 días desde la compra)",
        },
        { status: 400 },
      )
    }

    // Verificar que hayan pasado al menos 48h desde la compra
    const hoursSincePurchase = (now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60)
    if (hoursSincePurchase < 48) {
      return NextResponse.json(
        {
          error: "Debes esperar al menos 48 horas desde la compra para solicitar una devolución",
        },
        { status: 400 },
      )
    }

    // Verificar que no exista ya una reclamación para esta interacción
    const { data: existingClaim } = await supabase
      .from("lead_claims")
      .select("id")
      .eq("lead_interaction_id", leadInteractionId)
      .single()

    if (existingClaim) {
      return NextResponse.json({ error: "Ya existe una reclamación para este lead" }, { status: 400 })
    }

    // Calcular créditos a devolver (75%)
    const creditsToRefund = Math.floor(creditsSpent * 0.75)

    // Obtener datos del profesional para el email
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email, total_claims_submitted, total_claims_approved, total_claims_rejected")
      .eq("id", user.id)
      .single()

    // Crear la reclamación
    const { data: claim, error: claimError } = await supabase
      .from("lead_claims")
      .insert({
        lead_interaction_id: leadInteractionId,
        lead_request_id: leadRequestId,
        professional_id: user.id,
        lead_title: leadTitle,
        lead_city: leadCity,
        reason,
        reason_details: reasonDetails,
        call_attempts: callAttempts || 0,
        call_dates: callDates || [],
        whatsapp_sent: whatsappSent || false,
        sms_sent: smsSent || false,
        email_sent: emailSent || false,
        credits_spent: creditsSpent,
        credits_to_refund: creditsToRefund,
        status: "pending",
      })
      .select()
      .single()

    if (claimError) {
      console.error("[v0] Error creando reclamación:", claimError)
      return NextResponse.json({ error: "Error al crear la reclamación" }, { status: 500 })
    }

    // Actualizar el estado de la interacción
    await supabase
      .from("lead_interactions")
      .update({
        outcome: "claim_requested",
        claim_status: "pending",
        claim_reason: reason,
      })
      .eq("id", leadInteractionId)

    // Enviar email al profesional
    if (profile?.email) {
      await sendEmail({
        to: profile.email,
        subject: "Reclamación recibida - Presupuéstalo",
        html: emailClaimReceived({
          professionalName: profile.full_name || "Profesional",
          leadTitle: leadTitle || "Lead",
          reason,
          creditsSpent,
          creditsToRefund,
        }),
      })
    }

    // Enviar email al admin
    await sendAdminEmail(
      "Nueva reclamación pendiente",
      emailAdminNewClaim({
        professionalName: profile?.full_name || "Profesional",
        professionalEmail: profile?.email || user.email || "",
        leadTitle: leadTitle || "Lead",
        leadCity: leadCity || "",
        reason,
        reasonDetails,
        callAttempts: callAttempts || 0,
        creditsSpent,
        creditsToRefund,
        totalClaims: (profile?.total_claims_submitted || 0) + 1,
        approvedClaims: profile?.total_claims_approved || 0,
        rejectedClaims: profile?.total_claims_rejected || 0,
        claimId: claim.id,
      }),
    )

    return NextResponse.json({
      success: true,
      claim,
      message: "Reclamación enviada correctamente",
    })
  } catch (error: any) {
    console.error("[v0] Error en POST /api/leads/claims:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET - Obtener reclamaciones del usuario o todas (admin)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status")
    const isAdmin = searchParams.get("admin") === "true"

    // Verificar si es admin
    const { data: profile } = await supabase.from("profiles").select("role, email").eq("id", user.id).single()

    const isAdminUser =
      profile?.role === "admin" ||
      profile?.email === "pascualmollar@gmail.com" ||
      profile?.email === "admin@presupuestalo.es"

    let query = supabase
      .from("lead_claims")
      .select(`
        *,
        professional:profiles!lead_claims_professional_id_fkey(
          full_name,
          email,
          phone,
          company_name,
          total_claims_submitted,
          total_claims_approved,
          total_claims_rejected
        )
      `)
      .order("created_at", { ascending: false })

    // Si no es admin, solo ver sus propias reclamaciones
    if (!isAdminUser || !isAdmin) {
      query = query.eq("professional_id", user.id)
    }

    // Filtrar por estado si se especifica
    if (status) {
      query = query.eq("status", status)
    }

    const { data: claims, error } = await query

    if (error) {
      console.error("[v0] Error obteniendo reclamaciones:", error)
      return NextResponse.json({ error: "Error al obtener reclamaciones" }, { status: 500 })
    }

    return NextResponse.json({ claims, isAdmin: isAdminUser })
  } catch (error: any) {
    console.error("[v0] Error en GET /api/leads/claims:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
