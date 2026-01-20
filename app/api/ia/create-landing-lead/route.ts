import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

// Generar contraseña segura
function generateSecurePassword(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
  let password = "Pres2025!"
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

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
    const { email, fullName, phone, acceptedTerms, acceptedPrivacy, acceptedMarketing, estimationData } =
      await request.json()

    console.log("[v0] Creating landing lead for:", email, phone)

    // Validaciones
    if (!email || !fullName || !phone || !acceptedTerms || !acceptedPrivacy) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 })
    }

    if (!estimationData || !estimationData.estimated_budget_min || !estimationData.estimated_budget_max) {
      return NextResponse.json({ error: "Datos de estimación inválidos" }, { status: 400 })
    }

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Verificar si el teléfono ya tiene un lead activo
    const { data: existingPhone } = await supabaseAdmin
      .from("phone_verifications")
      .select(`
        lead_request_id,
        lead_requests!inner(status)
      `)
      .eq("phone", phone)
      .in("lead_requests.status", ["open", "pending"])
      .maybeSingle()

    if (existingPhone) {
      return NextResponse.json(
        {
          error: "Ya tienes una solicitud activa con este teléfono. Solo puedes tener una solicitud abierta a la vez.",
        },
        { status: 409 },
      )
    }

    // Verificar si el email ya existe
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id, email")
      .ilike("email", email)
      .maybeSingle()

    if (existingProfile) {
      return NextResponse.json(
        { error: "Ya existe una cuenta con este email. Por favor, inicia sesión o usa otro email." },
        { status: 409 },
      )
    }

    // Crear usuario en Supabase Auth
    const randomPassword = generateSecurePassword()
    const { data: authData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: randomPassword,
      email_confirm: true,
      user_metadata: { full_name: fullName, phone },
    })

    if (signUpError || !authData.user) {
      console.error("[v0] Error creating user:", signUpError)
      return NextResponse.json({ error: "Error al crear la cuenta: " + signUpError?.message }, { status: 500 })
    }

    const userId = authData.user.id
    console.log("[v0] User created:", userId)

    // Actualizar perfil (el trigger ya lo crea, solo actualizamos)
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        full_name: fullName,
        phone,
        phone_verified: true,
        country: "ES",
        user_type: "homeowner",
      })
      .eq("id", userId)

    if (profileError) {
      console.error("[v0] Error updating profile:", profileError)
      // Intentar sin user_type como último recurso
      const { error: retryError } = await supabaseAdmin
        .from("profiles")
        .update({
          full_name: fullName,
          phone,
          phone_verified: true,
          country: "ES",
        })
        .eq("id", userId)

      if (retryError) {
        await supabaseAdmin.auth.admin.deleteUser(userId)
        return NextResponse.json({ error: "Error al actualizar el perfil: " + retryError.message }, { status: 500 })
      }

      console.warn("[v0] Could not set user_type, profile created without it")
    }

    // Enviar email de bienvenida con credenciales
    try {
      await fetch(`${request.nextUrl.origin}/api/email/welcome-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, fullName, password: randomPassword }),
      })
    } catch (emailError) {
      console.error("[v0] Error sending welcome email:", emailError)
    }

    // Calcular precio intermedio y crear resumen
    const middlePrice = calculateMiddlePrice(estimationData.estimated_budget_min, estimationData.estimated_budget_max)
    const reformSummary = generateReformSummary(estimationData)
    const creditsCost = calculateLeadCreditsCost(middlePrice)

    const { data: leadRequest, error: leadError } = await supabaseAdmin
      .from("lead_requests")
      .insert({
        // project_id: null - no incluimos project_id
        homeowner_id: userId,
        status: "open",
        estimated_budget: middlePrice,
        credits_cost: creditsCost,
        reform_types: ["reforma_integral"],
        project_description: reformSummary,
        surface_m2: Number.parseInt(estimationData.squareMeters) || null,
        postal_code: null, // No tenemos código postal desde la landing
        city: estimationData.city || "",
        province: estimationData.province || estimationData.city || "",
        country_code: "ES",
        client_name: fullName,
        client_email: email,
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

    console.log("[v0] Lead request created:", leadRequest.id)

    // Registrar verificación de teléfono
    await supabaseAdmin.from("phone_verifications").insert({
      phone,
      lead_request_id: leadRequest.id,
      verified_at: new Date().toISOString(),
    })

    // Enviar email de confirmación de publicación
    try {
      await fetch(`${request.nextUrl.origin}/api/email/lead-published`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
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

    console.log("[v0] Landing lead created successfully:", leadRequest.id)

    return NextResponse.json({
      success: true,
      leadRequestId: leadRequest.id,
      userId: userId,
    })
  } catch (error) {
    console.error("[v0] Error creating landing lead:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
