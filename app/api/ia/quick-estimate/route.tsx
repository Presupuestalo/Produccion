import { type NextRequest, NextResponse } from "next/server"
import { generateObject, generateText } from "ai"
import { z } from "zod"
import { supabaseAdmin as supabase } from "@/lib/supabase-admin"
import { groq, DEFAULT_GROQ_MODEL, FAST_GROQ_MODEL } from "@/lib/ia/groq"

export const dynamic = "force-dynamic"

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
      model: groq(FAST_GROQ_MODEL),
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
  currency: { code: string; symbol: string }
  estimatedPriceRange?: string
}) {
  try {
    const { sendEmail } = await import("@/lib/email/send-email")
    const { ADMIN_EMAIL } = await import("@/lib/email/send-email")

    await sendEmail({
      to: ADMIN_EMAIL,
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
          ${data.estimatedPriceRange ? `<li><strong>Estimación generada:</strong> ${data.estimatedPriceRange}</li>` : ""}
        </ul>
        
        <h3>Moneda</h3>
        <ul>
          <li><strong>Código:</strong> ${data.currency.code}</li>
          <li><strong>Símbolo:</strong> ${data.currency.symbol}</li>
        </ul>
        
        <p><em>Este email fue generado automáticamente desde Presupuéstalo.</em></p>
      `,
    })
    console.log("[v0] Email de notificación enviado exitosamente")
  } catch (error) {
    console.error("[v0] Error enviando email de notificación:", error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reformType, squareMeters, rooms, bathrooms, country, city, heatingType, features, kitchenOptions, bathroomOptions, floorOptions, windowOptions } = body

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

    const heatingDescriptions: Record<string, string> = {
      keep: "Mantener calefacción actual (Sin cambios)",
      none: "No tiene calefacción y no desea instalarla",
      new_gas: "Nueva instalación completa de Gas Natural + Radiadores",
      replace_boiler: "Sustitución de caldera de gas antigua por una nueva de condensación",
      replace_radiators: "Sustitución de radiadores antiguos por nuevos más eficientes",
      underfloor: "Instalación de Suelo Radiante (Requiere levantar todo el suelo)",
      aerothermy: "Instalación de sistema de Aerotermia (Climatización eficiente)",
      electric: "Instalación de emisores térmicos eléctricos de bajo consumo",
      air_cond: "Instalación de Aire Acondicionado con Bomba de Calor",
    }

    const heatingDetail = heatingDescriptions[heatingType] || (['suelos', 'pintura', 'ventanas'].includes(reformType) ? 'No relevante para este tipo de obra' : heatingType)

    console.log("[v0] Generando estimación con datos:", {
      reformType,
      squareMeters,
      rooms,
      bathrooms,
      country,
      city,
      heatingType,
      currency,
    })

    const { text: estimationText } = await generateText({
      model: groq(DEFAULT_GROQ_MODEL),
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
 
 REGLA DE PRECISIÓN SEGÚN TIPO DE REFORMA:
 - Si el tipo es "${reformType}", enfócate en los costes específicos de esa área.
 - Una reforma "integral" incluye todo. Una reforma de "cocina" o "baño" debe ser mucho más específica en esos m².
 ${reformType === 'cocina' && kitchenOptions ? `
 DETALLES ESPECÍFICOS DE LA COCINA:
 - Mobiliario: ${kitchenOptions.cabinets ? 'Incluir armarios nuevos' : 'No incluir armarios'}
 - Isla/Península: ${kitchenOptions.island ? 'Sí, incluir' : 'No'}
 - Suelos: ${kitchenOptions.floorType === 'tile_to_tile' ? 'Quitar azulejo actual y poner nuevo' :
            kitchenOptions.floorType === 'tile_to_vinyl' ? 'Quitar baldosa y poner suelo vinílico/laminado' :
              kitchenOptions.floorType === 'vinyl_overlay' ? 'Poner vinilo/laminado encima del actual (Sin desescombro)' :
                kitchenOptions.floorType === 'wood_to_tile' ? 'Quitar madera/parquet y poner azulejo' : 'No tocar'
          }
 - Paredes: ${kitchenOptions.wallType === 'tile_to_tile' ? 'Quitar azulejo y poner nuevo' :
            kitchenOptions.wallType === 'tile_to_paint' ? 'Quitar azulejo, alisar y pintar' : 'No tocar'
          }
 - Electricidad: ${kitchenOptions.modifyElectricity ? 'Modificación estándar (1 punto luz, 1 interruptor, máx 5 enchufes)' : 'Mantener existente'}
 - Techo: ${kitchenOptions.dropCeiling ? 'Bajar techos con Pladur' : 'Mantener existente'}
 - Ventana: ${kitchenOptions.replaceWindow ? 'Renovar ventana (Aprox 1.2 x 1.2m, PVC/Alum)' : 'Mantener existente'}
 ` : ''}

 ${reformType === 'baño' && bathroomOptions ? `
 DETALLES ESPECÍFICOS DEL BAÑO:
 - Sanitarios: ${bathroomOptions.sanitaries ? 'Poner WC/Bidet nuevos' : 'Mantener existentes'}
 - Mobiliario: ${bathroomOptions.furniture ? 'Incluir mueble de lavabo y espejo' : 'No incluir mueble'}
 - Ducha/Bañera: ${bathroomOptions.showerOrTub === 'shower' ? 'Poner plato de ducha nuevo' :
            bathroomOptions.showerOrTub === 'tub' ? 'Poner bañera nueva' :
              bathroomOptions.showerOrTub === 'change_tub_to_shower' ? 'Cambiar bañera actual por plato de ducha' : 'Mantener existente'
          }
 - Suelos: ${bathroomOptions.floorType === 'tile_to_tile' ? 'Quitar baldosa actual y poner nueva' :
            bathroomOptions.floorType === 'tile_to_vinyl' ? 'Quitar baldosa y poner vinílico' :
              bathroomOptions.floorType === 'vinyl_overlay' ? 'Poner vinílico sobre la baldosa actual (Sin desescombro)' : 'No tocar'
          }
 - Paredes: ${bathroomOptions.wallType === 'tile_to_tile' ? 'Quitar azulejo y poner nuevo' :
            bathroomOptions.wallType === 'tile_to_paint' ? 'Quitar azulejo y pintar' : 'No tocar'
          }
 - Fontanería: ${bathroomOptions.modifyPlumbing ? 'Renovar tuberías y desagües' : 'Mantener existente'}
 - Electricidad: ${bathroomOptions.modifyElectricity ? 'Modificación estándar (puntos de luz y enchufes)' : 'Mantener existente'}
 - Techo: ${bathroomOptions.dropCeiling ? 'Bajar techos con Pladur' : 'Mantener existente'}
 - Ventana: ${bathroomOptions.replaceWindow ? 'Renovar ventana (Pequeña/Oscilobatiente)' : 'No tocar'}
 
 REGLA DE PINTURA EN BAÑOS/COCINAS:
 - Si las paredes son de azulejo (revestimiento cerámico), la partida de pintura debe limitarse EXCLUSIVAMENTE al techo (los m² de la estancia). No presupuestes pintura para paredes si se indica alicatado.
 ` : ''}

 ${reformType === 'suelos' && floorOptions ? `
 DETALLES ESPECÍFICOS DE SUELOS:
 - Demolición: ${floorOptions.liftCurrentFloor ? 'Levantar y retirar suelo actual (genera escombros)' : 'Instalar sobre suelo existente (sin demolición)'}
 - Material Elegido: ${floorOptions.newFloorType === 'laminate' ? 'Parquet Laminado / Flotante (AC4/AC5)' :
            floorOptions.newFloorType === 'vinyl' ? 'Suelo Vinílico (LVT/SPC resistente al agua)' :
              floorOptions.newFloorType === 'ceramic' ? 'Baldosa Cerámica o Porcelánico (requiere mortero)' :
                floorOptions.newFloorType === 'wood' ? 'Madera Natural (Roble o similar)' : 'Estándar'
          }
 - Rodapiés: ${floorOptions.includeRodapies ? 'Sí, incluir suministro e instalación de nuevos rodapiés' : 'No renovar rodapiés'}
 
 CONSEJOS ADICIONALES PARA SUELOS:
 - Incluye en tus recomendaciones consejos para elegir el material (ej: vinilo para zonas húmedas, resistencia AC si es laminado).
 - Explica qué sucede si se levanta el suelo (necesidad de nivelar, posibles sorpresas en el forjado).
 ` : ''}

 ${reformType === 'ventanas' && windowOptions ? `
 DETALLES ESPECÍFICOS DE VENTANAS:
 - Número de Ventanas: ${windowOptions.numWindows}
 - Material/Calidad: ${windowOptions.windowType === 'pvc' ? 'PVC (Gama Media, Doble Vidrio 4/16/4)' :
            windowOptions.windowType === 'pvc_premium' ? 'PVC (Gama Alta, Triple Vidrio + Argón)' :
              windowOptions.windowType === 'alum' ? 'Aluminio con Rotura de Puente Térmico (RPT)' :
                windowOptions.windowType === 'wood' ? 'Madera Natural Barnizada' : 'Estándar'
          }
 
 CONSEJOS ADICIONALES PARA VENTANAS:
 - Explica la importancia del coeficiente U de transmitancia térmica.
 - Menciona la necesidad de profesionales cualificados para asegurar la estanqueidad.
 - Comenta sobre posibles ayudas o subvenciones por eficiencia energética en ${country}.
 ` : ''}

 REGLA DE COSTES PARA ELECTRICIDAD:
 - Para una sola estancia, NO sobrepases costes excesivos. Una instalación estándar son 400-800 ${currency.symbol} por estancia (1 punto luz, 1 interruptor, 5 enchufes).
 
 Datos del proyecto:
 - Tipo de reforma: ${reformType}
 - Metros cuadrados: ${squareMeters}
 - Habitaciones: ${rooms}
 - Baños: ${bathrooms}
 - País: ${country}
 - Ciudad: ${city}
 - Calefacción (Situación): ${heatingDetail}
 - Características: ${features || "Ninguna especial"}
 
 AJUSTE DE PRECIOS PARA ${city}, ${country}:
 - Investiga y usa precios reales del mercado de construcción en ${country}
 - Considera el costo de vida en ${city}
 - Ajusta según disponibilidad de materiales locales
 - Ten en cuenta el costo de mano de obra en ${country}
 - Usa valores realistas para ${currency.code}
 
 Proporciona:
 1. Rango de precio en ${currency.code}: "XXX.XXX ${currency.symbol} - XXX.XXX ${currency.symbol}"
    - REGLA DE PRECISIÓN: El margen entre el precio mínimo y el máximo NO debe superar el 15%.
    - REALISMO: Usa precios competitivos de mercado reforma estándar, no de lujo, a menos que se especifique lo contrario.
 2. Desglose detallado por categorías con precios en ${currency.symbol}:
    - REGLA MATEMÁTICA OBLIGATORIA: La suma total de los importes del desglose DEBE SER EXACTAMENTE IGUAL al punto medio del rango de precio que has dado arriba.
    - Categorías a incluir:
        * Preliminares y Demoliciones
        * Albañilería y Ayudas
        * Fontanería y Saneamiento
        * Electricidad e Iluminación (Puntos estándar)
        * Climatización y Calefacción
        * Carpintería Exterior (Ventanas)
        * Carpintería Interior y Mobiliario (Puertas/Armarios/Muebles Cocina)
        * Revestimientos (Suelos/Paredes)
        * Pintura y Acabados
        * Gestión de Residuos y Limpieza
 3. 4-5 recomendaciones específicas para ${city}, ${country}
 4. TRÁMITES Y LICENCIAS:
    - Tipo de licencia necesaria para esta obra específica en ${country} (ej: Comunicación Previa, Obra Menor, etc.)
    - Estimación de tasas municipales (ICIO/Tasas) en ${currency.symbol}
    - URL oficial del Ayuntamiento o sede electrónica de ${city} para gestión de licencias.
 
 VERIFICACIÓN FINAL ANTES DE RESPONDER:
 - ¿Todos los precios usan ${currency.symbol}?
 - ¿No hay ningún € o símbolo incorrecto?
 - ¿Los montos son realistas para ${country}?
 
 RESPONDE EXCLUSIVAMENTE CON UN JSON SIGUIENDO ESTE ESQUEMA:
 {
   "priceRange": "string",
   "breakdown": [{"category": "string", "amount": "string"}],
   "recommendations": ["string"],
   "legalInfo": {
     "permitType": "string",
     "estimatedFee": "string",
     "cityHallUrl": "string"
   }
 }
 
 NO incluyas texto antes o después del JSON. Solo el JSON.`,
    })

    console.log("[v0] Estimación generada exitosamente")

    // Limpiar y parsear el JSON de la respuesta
    let estimation: any
    try {
      const cleanJson = estimationText
        .trim()
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
      estimation = JSON.parse(cleanJson)
    } catch (parseError) {
      console.error("[v0] Error parseando JSON de estimación:", parseError, estimationText)
      throw new Error("Error al procesar la respuesta de la IA")
    }

    let estimated_budget_min = 0
    let estimated_budget_max = 0

    try {
      const priceRangeClean = estimation.priceRange
        .replace(/[€$£R$S/Bs₲₡QLCN$]+/g, "") // Remover símbolos de moneda
        .replace(/\s+/g, " ")
        .trim()

      const parts = priceRangeClean.split("-").map((p: string) => p.trim())

      if (parts.length >= 2) {
        const parseNumber = (str: string) => {
          const digits = str.replace(/[^\d]/g, "")
          return Number.parseInt(digits, 10) || 0
        }
        estimated_budget_min = parseNumber(parts[0])
        estimated_budget_max = parseNumber(parts[1])
      }
    } catch (parseError) {
      console.error("[v0] Error parsing priceRange:", parseError)
    }

    try {
      await supabase.from("quick_estimates").insert({
        reform_type: reformType,
        square_meters: squareMeters,
        rooms: rooms,
        bathrooms: bathrooms,
        country: country,
        city: city,
        heating_type: heatingType,
        features: features || null,
        currency_code: currency.code,
        currency_symbol: currency.symbol,
        estimated_price_range: estimation.priceRange,
        estimated_breakdown: estimation.breakdown,
      })
      console.log("[v0] Estimación guardada en BD exitosamente")
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
