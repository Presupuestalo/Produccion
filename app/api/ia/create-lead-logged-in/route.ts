import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

// Calcular precio intermedio del rango
function calculateMiddlePrice(minPrice: number, maxPrice: number): number {
  return Math.round((minPrice + maxPrice) / 2)
}

// Calcular coste en créditos según presupuesto
function calculateLeadCreditsCost(budget: number): number {
  if (budget < 5000) return 8
  if (budget < 15000) return 15
  if (budget < 30000) return 25
  if (budget < 50000) return 35
  return 50
}

function generateReformSummary(estimationData: any): string {
  const parts: string[] = []

  if (estimationData.squareMeters) {
    parts.push(`Superficie: ${estimationData.squareMeters} m²`)
  }
  if (estimationData.rooms) {
    parts.push(`Dormitorios: ${estimationData.rooms}`)
  }
  if (estimationData.bathrooms) {
    parts.push(`Baños: ${estimationData.bathrooms}`)
  }
  if (estimationData.city) {
    parts.push(`Ciudad: ${estimationData.city}`)
  }
  if (estimationData.province) {
    parts.push(`Provincia: ${estimationData.province}`)
  }

  const heatingTypes: Record<string, string> = {
    central: "Calefacción Central",
    individual: "Calefacción Individual",
    electric: "Eléctrica",
    gas: "Caldera de gas + radiadores",
    underfloor: "Suelo Radiante",
    none: "Sin calefacción",
  }
  if (estimationData.heatingType) {
    parts.push(`Calefacción a instalar: ${heatingTypes[estimationData.heatingType] || estimationData.heatingType}`)
  }

  if (estimationData.estimated_budget_min && estimationData.estimated_budget_max) {
    parts.push(
      `Presupuesto estimado: ${estimationData.estimated_budget_min.toLocaleString("es-ES")}€ - ${estimationData.estimated_budget_max.toLocaleString("es-ES")}€`,
    )
  }

  if (estimationData.features && estimationData.features.trim()) {
    parts.push(`\nDescripción del proyecto:\n${estimationData.features}`)
  }

  return parts.join("\n")
}

export async function POST(request: NextRequest) {
  try {
    // Verificar que el usuario está autenticado
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: "Configuración de servidor incompleta" }, { status: 500 })
    }
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { phone, estimationData } = await request.json()

    console.log("[v0] Creating lead for logged in user:", user.email, phone)

    // Validaciones
    if (!phone) {
      return NextResponse.json({ error: "Falta el teléfono" }, { status: 400 })
    }

    if (!estimationData || !estimationData.estimated_budget_min || !estimationData.estimated_budget_max) {
      return NextResponse.json({ error: "Datos de estimación inválidos" }, { status: 400 })
    }



    // Obtener datos del perfil
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, company_name, phone")
      .eq("id", user.id)
      .single()

    const fullName = profile?.full_name || profile?.company_name || user.email?.split("@")[0] || "Usuario"

    // Verificar si el usuario ya tiene un lead activo
    const { data: existingLead } = await supabaseAdmin
      .from("lead_requests")
      .select("id, status")
      .eq("homeowner_id", user.id)
      .in("status", ["open", "pending"])
      .maybeSingle()

    if (existingLead) {
      return NextResponse.json(
        { error: "Ya tienes una solicitud activa. Solo puedes tener una solicitud abierta a la vez." },
        { status: 409 },
      )
    }

    // Actualizar teléfono en el perfil si es necesario
    if (phone !== profile?.phone) {
      await supabaseAdmin.from("profiles").update({ phone, phone_verified: true }).eq("id", user.id)
    }

    // Calcular precio intermedio y crear resumen
    const middlePrice = calculateMiddlePrice(estimationData.estimated_budget_min, estimationData.estimated_budget_max)
    const reformSummary = generateReformSummary(estimationData)
    const creditsCost = calculateLeadCreditsCost(middlePrice)

    // Crear lead request
    const { data: leadRequest, error: leadError } = await supabaseAdmin
      .from("lead_requests")
      .insert({
        homeowner_id: user.id,
        status: "open",
        estimated_budget: middlePrice,
        credits_cost: creditsCost,
        reform_types: ["reforma_integral"],
        project_description: reformSummary,
        surface_m2: Number.parseInt(estimationData.squareMeters) || null,
        city: estimationData.city || "",
        province: estimationData.province || estimationData.city || "",
        country_code: "ES",
        client_name: fullName,
        client_email: user.email,
        client_phone: phone,
        max_companies: 3,
        lead_type: "normal",
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single()

    if (leadError || !leadRequest) {
      console.error("[v0] Error creating lead request:", leadError)
      return NextResponse.json({ error: "Error al crear la solicitud: " + leadError?.message }, { status: 500 })
    }

    console.log("[v0] Lead request created for logged in user:", leadRequest.id)

    // Registrar verificación de teléfono
    await supabaseAdmin.from("phone_verifications").insert({
      phone,
      lead_request_id: leadRequest.id,
      verified_at: new Date().toISOString(),
    })

    // Enviar email de confirmación
    try {
      await fetch(`${request.nextUrl.origin}/api/email/lead-published`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          fullName,
          leadData: {
            city: estimationData.city,
            province: estimationData.province,
            squareMeters: estimationData.squareMeters,
            estimatedBudget: middlePrice,
            reformType: "Reforma Integral",
            description: reformSummary,
          },
          leadRequestId: leadRequest.id,
        }),
      })
    } catch (emailError) {
      console.error("[v0] Error sending lead published email:", emailError)
    }

    return NextResponse.json({
      success: true,
      leadRequestId: leadRequest.id,
    })
  } catch (error) {
    console.error("[v0] Error creating lead for logged in user:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
