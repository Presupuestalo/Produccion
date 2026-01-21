export const dynamic = "force-dynamic"
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
          prompt: `Eres un experto en reformas y construcciÃ³n. Un cliente quiere hacer una reforma de tipo "${reformType}" y ha descrito su proyecto asÃ­:

"${description}"

Datos adicionales del proyecto:
- UbicaciÃ³n: ${estimationData.city}, ${estimationData.country}
- Metros cuadrados: ${estimationData.squareMeters}mÂ²
- Habitaciones: ${estimationData.rooms}
- BaÃ±os: ${estimationData.bathrooms}
- EstimaciÃ³n de coste: ${estimationResult.priceRange}

Proporciona una explicaciÃ³n breve (mÃ¡ximo 150 palabras) que incluya:
1. Posibles gastos adicionales que debe considerar
2. Tiempo estimado de la reforma
3. 2-3 consejos prÃ¡cticos especÃ­ficos para su tipo de reforma

SÃ© conciso, prÃ¡ctico y Ãºtil. Escribe en espaÃ±ol de forma natural y profesional.`,
        })

        aiExplanation = text
        console.log("[v0] ExplicaciÃ³n generada con IA")
      } catch (aiError) {
        console.error("[v0] Error generando explicaciÃ³n con IA:", aiError)
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
          currency_symbol: estimationResult.currency?.symbol || "â‚¬",
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

    // Enviar email de notificaciÃ³n usando Resend
    try {
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "PresupuÃ©stalo <onboarding@resend.dev>",
          to: ["presupuestaloficial@gmail.com"],
          subject: `Nueva Solicitud de Presupuestos - ${reformType}`,
          html: `
            <h2>Nueva Solicitud de Presupuestos</h2>
            
            <h3>Datos de Contacto</h3>
            <ul>
              <li><strong>Email:</strong> ${email}</li>
              <li><strong>TelÃ©fono:</strong> ${phone}</li>
              <li><strong>Tipo de Reforma:</strong> ${reformType}</li>
            </ul>

            <h3>UbicaciÃ³n</h3>
            <ul>
              <li><strong>PaÃ­s:</strong> ${estimationData.country}</li>
              <li><strong>Ciudad:</strong> ${estimationData.city}</li>
            </ul>

            <h3>Detalles del Proyecto</h3>
            <ul>
              <li><strong>Metros Cuadrados:</strong> ${estimationData.squareMeters}mÂ²</li>
              <li><strong>Habitaciones:</strong> ${estimationData.rooms}</li>
              <li><strong>BaÃ±os:</strong> ${estimationData.bathrooms}</li>
              <li><strong>CalefacciÃ³n:</strong> ${estimationData.heatingType}</li>
              ${estimationData.availableBudget ? `<li><strong>Presupuesto Disponible:</strong> ${estimationData.availableBudget}</li>` : ""}
            </ul>

            <h3>DescripciÃ³n del Cliente</h3>
            <p>${description}</p>

            ${
              estimationData.features
                ? `
              <h3>CaracterÃ­sticas Adicionales</h3>
              <p>${estimationData.features}</p>
            `
                : ""
            }

            <h3>EstimaciÃ³n Generada</h3>
            <p><strong>Rango de Precio:</strong> ${estimationResult.priceRange}</p>

            ${
              aiExplanation
                ? `
              <h3>AnÃ¡lisis y Recomendaciones</h3>
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

