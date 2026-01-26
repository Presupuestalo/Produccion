import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { z } from "zod"
import { supabaseAdmin as supabase } from "@/lib/supabase-admin"
import { groqProvider, DEFAULT_GROQ_MODEL, FAST_GROQ_MODEL } from "@/lib/ia/groq"

export const dynamic = "force-dynamic"

function getCurrencyForCountry(countryInput: string): { code: string; symbol: string } {
  const normalized = countryInput.toLowerCase().trim()

  const countryVariants: Record<string, { code: string; symbol: string }> = {
    españa: { code: "EUR", symbol: "€" },
    spain: { code: "EUR", symbol: "€" },
    eeuu: { code: "USD", symbol: "$" },
    usa: { code: "USD", symbol: "$" },
    "estados unidos": { code: "USD", symbol: "$" },
    "united states": { code: "USD", symbol: "$" },
    us: { code: "USD", symbol: "$" },
    america: { code: "USD", symbol: "$" },
    méxico: { code: "MXN", symbol: "$" },
    mexico: { code: "MXN", symbol: "$" },
    argentina: { code: "ARS", symbol: "$" },
    colombia: { code: "COP", symbol: "$" },
    chile: { code: "CLP", symbol: "$" },
    perú: { code: "PEN", symbol: "S/" },
    peru: { code: "PEN", symbol: "S/" },
    francia: { code: "EUR", symbol: "€" },
    france: { code: "EUR", symbol: "€" },
    alemania: { code: "EUR", symbol: "€" },
    germany: { code: "EUR", symbol: "€" },
    italia: { code: "EUR", symbol: "€" },
    italy: { code: "EUR", symbol: "€" },
    portugal: { code: "EUR", symbol: "€" },
    "reino unido": { code: "GBP", symbol: "£" },
    uk: { code: "GBP", symbol: "£" },
    "united kingdom": { code: "GBP", symbol: "£" },
    inglaterra: { code: "GBP", symbol: "£" },
    england: { code: "GBP", symbol: "£" },
    brasil: { code: "BRL", symbol: "R$" },
    brazil: { code: "BRL", symbol: "R$" },
    uruguay: { code: "UYU", symbol: "$" },
    venezuela: { code: "VES", symbol: "Bs" },
    ecuador: { code: "USD", symbol: "$" },
    bolivia: { code: "BOB", symbol: "Bs" },
    paraguay: { code: "PYG", symbol: "₲" },
    "costa rica": { code: "CRC", symbol: "₡" },
    panamá: { code: "USD", symbol: "$" },
    panama: { code: "USD", symbol: "$" },
    "república dominicana": { code: "DOP", symbol: "$" },
    "republica dominicana": { code: "DOP", symbol: "$" },
    "dominican republic": { code: "DOP", symbol: "$" },
    guatemala: { code: "GTQ", symbol: "Q" },
    honduras: { code: "HNL", symbol: "L" },
    nicaragua: { code: "NIO", symbol: "C$" },
    "el salvador": { code: "USD", symbol: "$" },
  }

  return countryVariants[normalized] || { code: "EUR", symbol: "€" }
}

async function validateCity(city: string, country: string): Promise<{ isValid: boolean; suggestion?: string }> {
  try {
    const { text } = await generateText({
      model: groqProvider(FAST_GROQ_MODEL),
      prompt: `Eres un experto en geografía. Valida si la ciudad "${city}" existe en el país "${country}".

Responde SOLO con un JSON en este formato exacto:
{
  "isValid": true/false,
  "suggestion": "nombre correcto de la ciudad si hay un error tipográfico, o null si la ciudad no existe"
}

Responde SOLO el JSON, sin texto adicional.`,
    })

    const cleanText = text
      .trim()
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
    const result = JSON.parse(cleanText)
    return result
  } catch (error) {
    console.error("[v0] Error validando ciudad:", error)
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
  } catch (error) {
    console.error("[v0] Error enviando email de notificación:", error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reformType, customReformType, squareMeters, rooms, bathrooms, country, city, heatingType, features, kitchenOptions, bathroomOptions, floorOptions, windowOptions, paintOptions } = body

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

    const { text: estimationText } = await generateText({
      model: groqProvider(DEFAULT_GROQ_MODEL),
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
 - Si el tipo es "${reformType === 'other' ? customReformType : reformType}", enfócate en los costes específicos de esa área.
 - Una reforma "integral" incluye todo. Una reforma de "cocina" o "baño" debe ser mucho más específica en esos m².
 - Si el usuario seleccionó "Otro", el tipo específico de reforma es: "${customReformType}". Basa tus cálculos enteramente en esta descripción.
 
  ${(reformType === 'cocina' || reformType === 'integral') && kitchenOptions ? `
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
 - Paredes: ${bathroomOptions.wallType === 'tile_to_tile' ? 'Quitar azulejo actual y poner nuevo' :
            bathroomOptions.wallType === 'tile_to_paint' ? 'Quitar azulejo y pintar' : 'No tocar'
          }
 - Fontanería: ${bathroomOptions.modifyPlumbing ? 'Renovar tuberías y desagües' : 'Mantener existente'}
 - Electricidad: ${bathroomOptions.modifyElectricity ? 'Modificación estándar (puntos de luz y enchufes)' : 'Mantener existente'}
 - Techo: ${bathroomOptions.dropCeiling ? 'Bajar techos con Pladur' : 'Mantener existente'}
 - Ventana: ${bathroomOptions.replaceWindow ? 'Renovar ventana (Pequeña/Oscilobatiente)' : 'No tocar'}
 ` : ''}

  ${(reformType === 'pintura' || reformType === 'integral') && paintOptions ? `
  DETALLES ESPECÍFICOS DE PINTURA Y ALISADO:
  - Dormitorios a pintar: ${rooms}
  - Otras zonas: Salón/Comedor (siempre incluido) y Pasillo (${paintOptions.hallwayLength}m lineales).
  - Superficie de la vivienda (para techos): ${squareMeters} m2.
  - Estado actual: ${paintOptions.hasGotele ? 'Gotelé' : 'Liso'}.
  - Trabajo: ${paintOptions.action === 'alisar_paint' ? 'Quitar Gotelé / Alisar + Pintar' : 'Solo Pintar'}
  
  REGLA DE CÁLCULO ESTRICTA:
  1. SUPERFICIE DE PAREDES (M2): Estimación técnica basada en dormitorios y zonas.
  2. SUPERFICIE DE TECHOS (M2): Igual a la superficie de la vivienda (${squareMeters} m2).
  3. COSTES UNITARIOS (En ${currency.symbol}): Precios competitivos de mercado.
  ` : ''}

 ${reformType === 'suelos' && floorOptions ? `
 DETALLES ESPECÍFICOS DE SUELOS:
 - Demolición: ${floorOptions.liftCurrentFloor ? 'Levantar y retirar suelo actual' : 'Instalar sobre suelo existente'}
 - Material Elegido: ${floorOptions.newFloorType === 'laminate' ? 'Laminado' : floorOptions.newFloorType === 'vinyl' ? 'Vinílico' : floorOptions.newFloorType === 'ceramic' ? 'Cerámico' : 'Madera'}
 - Rodapiés: ${floorOptions.includeRodapies ? 'Sí' : 'No'}
 ` : ''}

  ${(reformType === 'ventanas' || reformType === 'integral') && windowOptions ? `
 DETALLES ESPECÍFICOS DE VENTANAS:
 - Número de Ventanas: ${windowOptions.numWindows}
 - Material: ${windowOptions.windowType}
 ` : ''}

  Datos del proyecto:
 - Tipo de reforma: ${reformType === 'other' ? 'Otro (' + customReformType + ')' : reformType}
 - Metros cuadrados: ${squareMeters}
 - Habitaciones: ${rooms}
 - Baños: ${bathrooms}
 - País: ${country}
 - Ciudad: ${city}
 - Calefacción (Situación): ${heatingDetail}
 - Características: ${features || "Ninguna especial"}
 
  Proporciona:
  1. Rango de precio en ${currency.code}: "XXX.XXX ${currency.symbol} - XXX.XXX ${currency.symbol}"
     - REGLA DE PRECISIÓN: El margen entre el precio mínimo y el máximo NO debe superar el 15%.
  2. Desglose detallado por categorías con precios en ${currency.symbol}:
     - REGLA MATEMÁTICA: La suma total debe coincidir con el punto medio del rango.
     - Categorías a incluir:
          * Preliminares y Demoliciones (si aplica para ${reformType === 'other' ? customReformType : reformType})
          * Albañilería y Ayudas
          * Fontanería y Saneamiento
          * Electricidad e Iluminación
          * Climatización y Calefacción
          * Carpintería Exterior
          * Carpintería Interior y Mobiliario
          * Revestimientos (Suelos/Paredes)
          * Pintura y Acabados
          * Gestión de Residuos y Limpieza
          * En caso de ser "${customReformType}", añade las partidas específicas necesarias.
  3. 4-5 recomendaciones específicas
  4. TRÁMITES Y LICENCIAS para ${city}
  
  RESPONDE EXCLUSIVAMENTE CON UN JSON:
  {
    "priceRange": "string",
    "breakdown": [{"category": "string", "amount": "string", "description": "string"}],
    "recommendations": ["string"],
    "legalInfo": {"permitType": "string", "estimatedFee": "string", "cityHallUrl": "string"},
    "grantsInfo": {"available": boolean, "details": "string", "links": [{"label": "string", "url": "string"}]}
  }
  
  NO incluyas texto antes o después del JSON. Solo el JSON.`,
    })

    let estimation: any
    try {
      const cleanJson = estimationText
        .trim()
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
      estimation = JSON.parse(cleanJson)
    } catch (parseError) {
      console.error("[v0] Error parseando JSON:", parseError, estimationText)
      throw new Error("Error al procesar la respuesta de la IA")
    }

    let estimated_budget_min = 0
    let estimated_budget_max = 0

    try {
      const priceRangeClean = estimation.priceRange
        .replace(/[€$£R$S/Bs₲₡QLCN$]+/g, "")
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
        reform_type: reformType === 'other' ? customReformType : reformType,
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
      console.error("[v0] Error en email:", error)
    })

    return NextResponse.json({
      ...estimation,
      estimated_budget_min,
      estimated_budget_max,
      currency,
    })
  } catch (error) {
    console.error("[v0] Error en POST:", error)
    return NextResponse.json({ error: "Error al generar estimación." }, { status: 500 })
  }
}
