import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { offerId, creditsCost } = await request.json()

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    // Obtener datos del profesional
    const { data: professional, error: profError } = await supabase
      .from("profiles")
      .select("full_name, company_name, email, phone, subscription_plan")
      .eq("id", user.id)
      .single()

    if (profError || !professional) {
      return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 })
    }

    // Obtener balance de créditos
    const { data: credits, error: creditsError } = await supabase
      .from("company_credits")
      .select("credits_balance")
      .eq("company_id", user.id)
      .single()

    if (creditsError || !credits) {
      return NextResponse.json({ error: "No tienes créditos configurados" }, { status: 400 })
    }

    if (credits.credits_balance < creditsCost) {
      return NextResponse.json({ error: "Créditos insuficientes" }, { status: 400 })
    }

    // Obtener la oferta (quote_request)
    const { data: offer, error: offerError } = await supabase
      .from("quote_requests")
      .select(`
        *,
        profiles!quote_requests_user_id_fkey (
          full_name,
          email,
          phone
        )
      `)
      .eq("id", offerId)
      .single()

    if (offerError || !offer) {
      return NextResponse.json({ error: "Oferta no encontrada" }, { status: 404 })
    }

    // Verificar que no haya llegado al máximo de empresas (3)
    const currentCount = offer.offer_count || 0
    const maxCompanies = 3

    if (currentCount >= maxCompanies) {
      return NextResponse.json({ error: "Esta oferta ya tiene el máximo de empresas" }, { status: 400 })
    }

    // Verificar que el profesional no haya accedido ya
    const { data: existingAccess } = await supabase
      .from("quote_offers")
      .select("id")
      .eq("quote_request_id", offerId)
      .eq("professional_id", user.id)
      .single()

    if (existingAccess) {
      return NextResponse.json({ error: "Ya has accedido a esta oferta" }, { status: 400 })
    }

    // Descontar créditos
    const { error: deductError } = await supabase
      .from("company_credits")
      .update({
        credits_balance: credits.credits_balance - creditsCost,
        credits_spent_total: supabase.rpc ? creditsCost : creditsCost,
      })
      .eq("company_id", user.id)

    if (deductError) {
      console.error("Error deducting credits:", deductError)
      return NextResponse.json({ error: "Error al descontar créditos" }, { status: 500 })
    }

    // Registrar transacción
    await supabase.from("credit_transactions").insert({
      company_id: user.id,
      type: "spent",
      amount: -creditsCost,
      description: `Acceso a oferta: ${offer.reform_type} en ${offer.city}`,
      lead_request_id: offerId,
    })

    // Crear registro de acceso en quote_offers (sin propuesta aún)
    const { error: accessError } = await supabase.from("quote_offers").insert({
      quote_request_id: offerId,
      professional_id: user.id,
      offered_price: 0, // Pendiente de propuesta
      currency_code: offer.currency_code || "EUR",
      currency_symbol: offer.currency_symbol || "€",
      description: "Pendiente de propuesta",
      company_name: professional.company_name || professional.full_name,
      professional_phone: professional.phone,
      professional_email: professional.email || user.email,
      status: "accessed", // Nuevo estado: solo accedido, sin propuesta
    })

    if (accessError) {
      console.error("Error creating access record:", accessError)
      // Revertir créditos si falla
      await supabase
        .from("company_credits")
        .update({ credits_balance: credits.credits_balance })
        .eq("company_id", user.id)
      return NextResponse.json({ error: "Error al registrar acceso" }, { status: 500 })
    }

    // Enviar emails de notificación
    const clientData = {
      name: offer.profiles?.full_name || "Cliente",
      email: offer.profiles?.email || offer.contact_email,
      phone: offer.profiles?.phone || offer.contact_phone,
      address: `${offer.city}, ${offer.country}`,
    }

    // Email al propietario
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ""}/api/email/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: clientData.email,
          subject: "Un profesional está interesado en tu proyecto",
          template: "professional-interested",
          data: {
            clientName: clientData.name,
            professionalName: professional.company_name || professional.full_name,
            professionalEmail: professional.email || user.email,
            professionalPhone: professional.phone,
            reformType: offer.reform_type,
            budget: offer.price_range,
          },
        }),
      })
    } catch (emailError) {
      console.error("Error sending email to client:", emailError)
    }

    // Email al profesional
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ""}/api/email/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: professional.email || user.email,
          subject: "Has accedido a una nueva oferta",
          template: "offer-access-confirmation",
          data: {
            professionalName: professional.full_name,
            clientName: clientData.name,
            clientEmail: clientData.email,
            clientPhone: clientData.phone,
            reformType: offer.reform_type,
            budget: offer.price_range,
            city: offer.city,
            offerId: offerId,
          },
        }),
      })
    } catch (emailError) {
      console.error("Error sending email to professional:", emailError)
    }

    return NextResponse.json({
      success: true,
      clientData,
      creditsDeducted: creditsCost,
      newBalance: credits.credits_balance - creditsCost,
    })
  } catch (error: any) {
    console.error("Error in access offer:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
