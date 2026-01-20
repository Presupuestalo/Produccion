import { type NextRequest, NextResponse } from "next/server"
import { generateObject, generateText } from "ai"
import { z } from "zod"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

function getCurrencyForCountry(countryInput: string): { code: string; symbol: string } {
  const normalized = countryInput.toLowerCase().trim()

  // Mapa de variantes de nombres de países a moneda
  const countryVariants: Record<string, { code: string; symbol: string }> = {
    // España
    españa: { code: "EUR", symbol: "€" },
    spain: { code: "EUR", symbol: "€" },

    // Estados Unidos
    eeuu: { code: "USD", symbol: "$" },
    usa: { code: "USD", symbol: "$" },
    "estados unidos": { code: "USD", symbol: "$" },
    "united states": { code: "USD", symbol: "$" },
    us: { code: "USD", symbol: "$" },
    america: { code: "USD", symbol: "$" },

    // México
    méxico: { code: "MXN", symbol: "$" },
    mexico: { code: "MXN", symbol: "$" },

    // Argentina
    argentina: { code: "ARS", symbol: "$" },

    // Colombia
    colombia: { code: "COP", symbol: "$" },

    // Chile
    chile: { code: "CLP", symbol: "$" },

    // Perú
    perú: { code: "PEN", symbol: "S/" },
    peru: { code: "PEN", symbol: "S/" },

    // Francia
    francia: { code: "EUR", symbol: "€" },
    france: { code: "EUR", symbol: "€" },

    // Alemania
    alemania: { code: "EUR", symbol: "€" },
    germany: { code: "EUR", symbol: "€" },

    // Italia
    italia: { code: "EUR", symbol: "€" },
    italy: { code: "EUR", symbol: "€" },

    // Portugal
    portugal: { code: "EUR", symbol: "€" },

    // Reino Unido
    "reino unido": { code: "GBP", symbol: "£" },
    uk: { code: "GBP", symbol: "£" },
    "united kingdom": { code: "GBP", symbol: "£" },
    inglaterra: { code: "GBP", symbol: "£" },
    england: { code: "GBP", symbol: "£" },

    // Brasil
    brasil: { code: "BRL", symbol: "R$" },
    brazil: { code: "BRL", symbol: "R$" },

    // Uruguay
    uruguay: { code: "UYU", symbol: "$" },

    // Venezuela
    venezuela: { code: "VES", symbol: "Bs" },

    // Ecuador
    ecuador: { code: "USD", symbol: "$" },

    // Bolivia
    bolivia: { code: "BOB", symbol: "Bs" },

    // Paraguay
    paraguay: { code: "PYG", symbol: "₲" },

    // Costa Rica
    "costa rica": { code: "CRC", symbol: "₡" },

    // Panamá
    panamá: { code: "USD", symbol: "$" },
    panama: { code: "USD", symbol: "$" },

    // República Dominicana
    "república dominicana": { code: "DOP", symbol: "$" },
    "republica dominicana": { code: "DOP", symbol: "$" },
    "dominican republic": { code: "DOP", symbol: "$" },

    // Guatemala
    guatemala: { code: "GTQ", symbol: "Q" },

    // Honduras
    honduras: { code: "HNL", symbol: "L" },

    // Nicaragua
    nicaragua: { code: "NIO", symbol: "C$" },

    // El Salvador
    "el salvador": { code: "USD", symbol: "$" },
  }

  return countryVariants[normalized] || { code: "EUR", symbol: "€" }
}

const estimationSchema = z.object({
  priceRange: z.string(),
  breakdown: z.array(
    z.object({
      category: z.string(),
      amount: z.string(),
    }),
  ),
  recommendations: z.array(z.string()),
  budgetWarning: z.string().optional(),
  budgetAdvice: z.array(z.string()).optional(),
})

async function validateCity(city: string, country: string): Promise<{ isValid: boolean; suggestion?: string }> {
  try {
    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt: `Eres un experto en geografía. Valida si la ciudad "${city}" existe en el país "${country}".

Responde SOLO con un JSON en este formato exacto:
{
  "isValid": true/false,
  "suggestion": "nombre correcto de la ciudad si hay un error tipográfico, o null si la ciudad no existe"
}

Ejemplos:
- Si la ciudad es "chimping" en México: {"isValid": false, "suggestion": null}
- Si la ciudad es "guanajato" en México: {"isValid": false, "suggestion": "Guanajuato"}
- Si la ciudad es "Nueva York" en EEUU: {"isValid": true, "suggestion": null}
- Si la ciudad es "Bilbao" en España: {"isValid": true, "suggestion": null}

Responde SOLO el JSON, sin texto adicional.`,
    })

    // Intentar parsear la respuesta como JSON
    const cleanText = text
      .trim()
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
    const result = JSON.parse(cleanText)
    return result
  } catch (error) {
    console.error("[v0] Error validando ciudad:", error)
    // Si hay error, asumimos que la ciudad es válida para no bloquear al usuario
    return { isValid: true }
  }
}

async function sendEstimationNotification(data: {
  squareMeters: string
  rooms: string
  bathrooms: string
  country: string
  city: string
  heatingType: string
  availableBudget?: string
  currency: { code: string; symbol: string }
  estimatedPriceRange?: string
}) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey) {
      console.error("[v0] RESEND_API_KEY no configurada")
      return
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Presupuéstalo <onboarding@resend.dev>",
        to: ["presupuestaloficial@gmail.com"],
        subject: `Nueva Estimación de Presupuesto - ${data.city}, ${data.country}`,
        html: `
          <h2>Nueva Estimación de Presupuesto</h2>
          <h3>Ubicación</h3>
          <ul>
            <li><strong>País:</strong> ${data.country}</li>
            <li><strong>Ciudad:</strong> ${data.city}</li>
          </ul>
          
          <h3>Detalles del Proyecto</h3>
          <ul>
            <li><strong>Metros cuadrados:</strong> ${data.squareMeters}</li>
            <li><strong>Habitaciones:</strong> ${data.rooms}</li>
            <li><strong>Baños:</strong> ${data.bathrooms}</li>
            <li><strong>Tipo de calefacción:</strong> ${data.heatingType}</li>
            ${data.availableBudget ? `<li><strong>Presupuesto disponible:</strong> ${data.availableBudget} ${data.currency.symbol}</li>` : ""}
            ${data.estimatedPriceRange ? `<li><strong>Estimación generada:</strong> ${data.estimatedPriceRange}</li>` : ""}
          </ul>
          
          <h3>Moneda</h3>
          <ul>
            <li><strong>Código:</strong> ${data.currency.code}</li>
            <li><strong>Símbolo:</strong> ${data.currency.symbol}</li>
          </ul>
          
          <p><em>Este email fue generado automáticamente desde Presupuéstalo.</em></p>
        `,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("[v0] Error enviando email con Resend:", error)
    } else {
      console.log("[v0] Email de notificación enviado exitosamente")
    }
  } catch (error) {
    console.error("[v0] Error enviando email de notificación:", error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { squareMeters, rooms, bathrooms, country, city, heatingType, features, availableBudget } = body

    const cityValidation = await validateCity(city, country)

    if (!cityValidation.isValid) {
      if (cityValidation.suggestion) {
        return NextResponse.json(
          {
            error: `La ciudad "${city}" no existe en ${country}. ¿Quisiste decir "${cityValidation.suggestion}"?`,
            suggestion: cityValidation.suggestion,
          },
          { status: 400 },
        )
      } else {
        return NextResponse.json(
          {
            error: `La ciudad "${city}" no parece existir en ${country}. Por favor, verifica el nombre de la ciudad.`,
          },
          { status: 400 },
        )
      }
    }

    const currency = getCurrencyForCountry(country)

    const hasValidBudget = availableBudget && availableBudget.trim() !== "" && Number(availableBudget) > 0

    console.log("[v0] Generando estimación con datos:", {
      squareMeters,
      rooms,
      bathrooms,
      country,
      city,
      heatingType,
      availableBudget,
      hasValidBudget,
      currency,
    })

    const { object: estimation } = await generateObject({
      model: "openai/gpt-4o",
      schema: estimationSchema,
      prompt: `Eres un experto en presupuestos de reformas en ${country}.

REGLA CRÍTICA SOBRE MONEDA - LEE ESTO PRIMERO:
=================================================
El país es: ${country}
La moneda OBLIGATORIA es: ${currency.code}
El símbolo OBLIGATORIO es: ${currency.symbol}

NUNCA uses € (euros) a menos que el país sea España, Francia, Alemania, Italia o Portugal.
NUNCA uses $ (dólares) a menos que el país sea Estados Unidos, México, Argentina, Colombia, Chile, Uruguay, etc.

Para ${country}, DEBES usar EXCLUSIVAMENTE: ${currency.symbol}

Ejemplo de formato correcto para ${country}:
- "150.000 ${currency.symbol} - 200.000 ${currency.symbol}"
- "Demolición: 25.000 ${currency.symbol}"
- "Fontanería: 35.000 ${currency.symbol}"

Si usas cualquier otro símbolo de moneda que no sea ${currency.symbol}, tu respuesta será INCORRECTA.
=================================================

Datos del proyecto:
- Metros cuadrados: ${squareMeters}
- Habitaciones: ${rooms}
- Baños: ${bathrooms}
- País: ${country}
- Ciudad: ${city}
- Calefacción: ${heatingType}
- Características: ${features || "Ninguna especial"}
${hasValidBudget ? `- Presupuesto disponible: ${availableBudget} ${currency.symbol}` : ""}

AJUSTE DE PRECIOS PARA ${city}, ${country}:
- Investiga y usa precios reales del mercado de construcción en ${country}
- Considera el costo de vida en ${city}
- Ajusta según disponibilidad de materiales locales
- Ten en cuenta el costo de mano de obra en ${country}
- Usa valores realistas para ${currency.code}

Proporciona:
1. Rango de precio en ${currency.code}: "XXX.XXX ${currency.symbol} - XXX.XXX ${currency.symbol}"
2. Desglose por categorías con precios en ${currency.symbol}:
   - Demolición: XX.XXX ${currency.symbol}
   - Albañilería: XX.XXX ${currency.symbol}
   - Fontanería: XX.XXX ${currency.symbol}
   - Electricidad: XX.XXX ${currency.symbol}
   - Carpintería: XX.XXX ${currency.symbol}
   - Pintura: XX.XXX ${currency.symbol}
3. 4-5 recomendaciones específicas para ${city}, ${country}

${
  hasValidBudget
    ? `
4. ANÁLISIS DE PRESUPUESTO (en ${currency.symbol}):
   - Si ${availableBudget} ${currency.symbol} < estimación mínima:
     * "budgetWarning": Explica la diferencia en ${currency.symbol}
     * "budgetAdvice": 5-7 consejos prácticos para ${country}
   - Si el presupuesto es suficiente: deja vacíos budgetWarning y budgetAdvice
`
    : `
4. IMPORTANTE: El usuario NO proporcionó un presupuesto disponible.
   - NO generes "budgetWarning"
   - NO generes "budgetAdvice"
   - Deja estos campos vacíos o undefined
`
}

VERIFICACIÓN FINAL ANTES DE RESPONDER:
- ¿Todos los precios usan ${currency.symbol}?
- ¿No hay ningún € o símbolo incorrecto?
- ¿Los montos son realistas para ${country}?
${!hasValidBudget ? "- ¿Has dejado budgetWarning y budgetAdvice vacíos porque no hay presupuesto?" : ""}

RESPONDE AHORA usando SOLO ${currency.symbol} en todos los precios.`,
    })

    console.log("[v0] Estimación generada exitosamente")

    let estimated_budget_min = 0
    let estimated_budget_max = 0

    try {
      // El priceRange viene en formato "150.000 € - 200.000 €" o similar
      const priceRangeClean = estimation.priceRange
        .replace(/[€$£R$S/Bs₲₡QLCN$]+/g, "") // Remover símbolos de moneda
        .replace(/\s+/g, " ")
        .trim()

      // Buscar dos números separados por "-"
      const parts = priceRangeClean.split("-").map((p) => p.trim())

      if (parts.length >= 2) {
        // Parsear números con formato europeo (150.000) o americano (150,000)
        const parseNumber = (str: string) => {
          // Remover todo excepto dígitos
          const digits = str.replace(/[^\d]/g, "")
          return Number.parseInt(digits, 10) || 0
        }

        estimated_budget_min = parseNumber(parts[0])
        estimated_budget_max = parseNumber(parts[1])
      }

      console.log("[v0] Parsed budget range:", { estimated_budget_min, estimated_budget_max })
    } catch (parseError) {
      console.error("[v0] Error parsing priceRange:", parseError)
    }

    try {
      const { error: dbError } = await supabase.from("quick_estimates").insert({
        square_meters: squareMeters,
        rooms: rooms,
        bathrooms: bathrooms,
        country: country,
        city: city,
        heating_type: heatingType,
        available_budget: availableBudget || null,
        currency_code: currency.code,
        currency_symbol: currency.symbol,
        estimated_price_range: estimation.priceRange,
        estimated_breakdown: estimation.breakdown,
      })

      if (dbError) {
        console.error("[v0] Error guardando estimación en BD:", dbError)
      } else {
        console.log("[v0] Estimación guardada en BD exitosamente")
      }
    } catch (dbError) {
      console.error("[v0] Error al intentar guardar en BD:", dbError)
    }

    sendEstimationNotification({
      squareMeters,
      rooms,
      bathrooms,
      country,
      city,
      heatingType,
      availableBudget,
      currency,
      estimatedPriceRange: estimation.priceRange,
    }).catch((error) => {
      console.error("[v0] Error en notificación por email (no crítico):", error)
    })

    return NextResponse.json({
      ...estimation,
      estimated_budget_min,
      estimated_budget_max,
      currency,
    })
  } catch (error) {
    console.error("[v0] Error generating estimation:", error)
    return NextResponse.json({ error: "Error al generar estimación. Por favor, intenta de nuevo." }, { status: 500 })
  }
}
