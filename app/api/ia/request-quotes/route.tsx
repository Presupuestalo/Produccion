import { NextResponse } from "next/server"
import { generateText } from "ai"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { reformType, phone, email, description, estimationData, estimationResult } = body

    console.log("[v0] Solicitud de presupuestos recibida:", {
      reformType,
      phone,
      email,
      city: estimationData.city,
      country: estimationData.country,
    })

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          },
        },
      },
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    let aiExplanation = ""
    if (description) {
      try {
        const { text } = await generateText({
          model: "openai/gpt-4o-mini",
          prompt: `Eres un experto en reformas y construcción. Un cliente quiere hacer una reforma de tipo "${reformType}" y ha descrito su proyecto así:

"${description}"

Datos adicionales del proyecto:
- Ubicación: ${estimationData.city}, ${estimationData.country}
- Metros cuadrados: ${estimationData.squareMeters}m²
- Habitaciones: ${estimationData.rooms}
- Baños: ${estimationData.bathrooms}
- Estimación de coste: ${estimationResult.priceRange}

Proporciona una explicación breve (máximo 150 palabras) que incluya:
1. Posibles gastos adicionales que debe considerar
2. Tiempo estimado de la reforma
3. 2-3 consejos prácticos específicos para su tipo de reforma

Sé conciso, práctico y útil. Escribe en español de forma natural y profesional.`,
        })

        aiExplanation = text
        console.log("[v0] Explicación generada con IA")
      } catch (aiError) {
        console.error("[v0] Error generando explicación con IA:", aiError)
      }
    }

    if (user) {
      try {
        const { error: dbError } = await supabase.from("quote_requests").insert({
          user_id: user.id,
          square_meters: estimationData.squareMeters,
          rooms: estimationData.rooms,
          bathrooms: estimationData.bathrooms,
          country: estimationData.country,
          city: estimationData.city,
          heating_type: estimationData.heatingType,
          features: estimationData.features || null,
          available_budget: estimationData.availableBudget || null,
          reform_type: reformType,
          phone,
          email,
          description,
          price_range: estimationResult.priceRange,
          currency_code: estimationResult.currency?.code || "EUR",
          currency_symbol: estimationResult.currency?.symbol || "€",
          ai_explanation: aiExplanation || null,
          status: "pending",
        })

        if (dbError) {
          console.error("[v0] Error guardando solicitud en BD:", dbError)
        } else {
          console.log("[v0] Solicitud guardada en BD correctamente")
        }
      } catch (dbError) {
        console.error("[v0] Error al guardar en BD:", dbError)
      }
    }

    // Enviar email de notificación usando Resend
    try {
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Presupuéstalo <onboarding@resend.dev>",
          to: ["presupuestaloficial@gmail.com"],
          subject: `Nueva Solicitud de Presupuestos - ${reformType}`,
          html: `
            <h2>Nueva Solicitud de Presupuestos</h2>
            
            <h3>Datos de Contacto</h3>
            <ul>
              <li><strong>Email:</strong> ${email}</li>
              <li><strong>Teléfono:</strong> ${phone}</li>
              <li><strong>Tipo de Reforma:</strong> ${reformType}</li>
            </ul>

            <h3>Ubicación</h3>
            <ul>
              <li><strong>País:</strong> ${estimationData.country}</li>
              <li><strong>Ciudad:</strong> ${estimationData.city}</li>
            </ul>

            <h3>Detalles del Proyecto</h3>
            <ul>
              <li><strong>Metros Cuadrados:</strong> ${estimationData.squareMeters}m²</li>
              <li><strong>Habitaciones:</strong> ${estimationData.rooms}</li>
              <li><strong>Baños:</strong> ${estimationData.bathrooms}</li>
              <li><strong>Calefacción:</strong> ${estimationData.heatingType}</li>
              ${estimationData.availableBudget ? `<li><strong>Presupuesto Disponible:</strong> ${estimationData.availableBudget}</li>` : ""}
            </ul>

            <h3>Descripción del Cliente</h3>
            <p>${description}</p>

            ${
              estimationData.features
                ? `
              <h3>Características Adicionales</h3>
              <p>${estimationData.features}</p>
            `
                : ""
            }

            <h3>Estimación Generada</h3>
            <p><strong>Rango de Precio:</strong> ${estimationResult.priceRange}</p>

            ${
              aiExplanation
                ? `
              <h3>Análisis y Recomendaciones</h3>
              <p>${aiExplanation.replace(/\n/g, "<br>")}</p>
            `
                : ""
            }
          `,
        }),
      })

      if (!emailResponse.ok) {
        console.error("[v0] Error enviando email:", await emailResponse.text())
      } else {
        console.log("[v0] Email de solicitud de presupuestos enviado correctamente")
      }
    } catch (emailError) {
      console.error("[v0] Error enviando email de solicitud:", emailError)
    }

    return NextResponse.json({ success: true, explanation: aiExplanation })
  } catch (error) {
    console.error("[v0] Error procesando solicitud de presupuestos:", error)
    return NextResponse.json({ error: "Error procesando solicitud" }, { status: 500 })
  }
}
