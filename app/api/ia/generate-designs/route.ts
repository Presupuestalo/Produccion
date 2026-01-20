import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateText } from "ai"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const formData = await request.formData()
    const image = formData.get("image") as File
    const roomType = formData.get("roomType") as string
    const style = formData.get("style") as string
    const details = formData.get("details") as string

    if (!image || !roomType || !style) {
      return NextResponse.json({ error: "Imagen, tipo de habitación y estilo son requeridos" }, { status: 400 })
    }

    const bytes = await image.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString("base64")
    const mimeType = image.type || "image/png"
    const imageUrl = `data:${mimeType};base64,${base64}`

    console.log("[v0] Validando que sea una sola habitación...")

    const validationResult = await generateText({
      model: "openai/gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              image: imageUrl,
            },
            {
              type: "text",
              text: `Analiza esta imagen y responde SOLO con "SI" o "NO". 

              Responde "SI" si:
              - La imagen muestra UNA habitación individual (puede estar vacía o con objetos)
              - Es un espacio interior con paredes, suelo y techo visibles
              - Tiene ventanas, puertas o elementos arquitectónicos de una habitación
              - Es una fotografía o render 3D de un espacio interior real
              
              Responde "NO" SOLO si:
              - Muestra claramente MÚLTIPLES habitaciones diferentes al mismo tiempo
              - Es un plano arquitectónico 2D completo de varias habitaciones
              - Es un espacio completamente exterior (jardín, terraza sin techo)
              - No es una imagen de un espacio interior
              
              IMPORTANTE: Una habitación vacía con paredes, ventanas y suelo ES VÁLIDA.
              
              Respuesta:`,
            },
          ],
        },
      ],
    })

    const isValid = validationResult.text.trim().toUpperCase().includes("SI")

    if (!isValid) {
      return NextResponse.json(
        {
          error:
            "La imagen debe mostrar UNA SOLA habitación. Por favor, sube una imagen de una habitación individual, no un plano completo con múltiples habitaciones.",
        },
        { status: 400 },
      )
    }

    console.log("[v0] Validación exitosa, generando diseño...")

    const roomTypeNames: Record<string, string> = {
      bedroom: "dormitorio",
      living: "salón",
      kitchen: "cocina",
      bathroom: "baño",
      dining: "comedor",
      office: "oficina",
    }

    const styleNames: Record<string, string> = {
      modern: "moderno",
      industrial: "industrial",
      scandinavian: "escandinavo",
      rustic: "rústico",
      contemporary: "contemporáneo",
      minimalist: "minimalista",
    }

    const essentialElements: Record<string, string[]> = {
      bedroom: [
        "Cama (elemento central y principal)",
        "Armario o closet empotrado (debe llegar hasta el techo)",
        "Mesitas de noche a ambos lados de la cama",
        "Lámpara de techo o lámparas de mesita",
      ],
      living: [
        "Televisión montada en la pared o sobre mueble",
        "Sofá enfrentado DIRECTAMENTE a la televisión para poder verla",
        "Mesa de centro delante del sofá",
        "Mueble bajo la TV o estantería",
        "Iluminación ambiental",
      ],
      kitchen: [
        "Encimera de cocina con zona de trabajo",
        "Armarios superiores (hasta el techo) e inferiores",
        "Fregadero integrado en la encimera",
        "Placa de cocción/vitrocerámica",
        "Campana extractora sobre la placa",
        "Nevera/frigorífico",
        "Horno integrado",
      ],
      bathroom: [
        "Inodoro",
        "Lavabo con mueble o encimera",
        "Ducha o bañera",
        "Espejo sobre el lavabo",
        "Toallero",
        "Mueble de almacenamiento",
      ],
      dining: [
        "Mesa de comedor (elemento central)",
        "Sillas alrededor de la mesa (mínimo 4)",
        "Aparador o mueble auxiliar",
        "Lámpara colgante sobre la mesa",
      ],
      office: [
        "Escritorio (elemento principal)",
        "Silla de oficina ergonómica",
        "Estanterías o librería (hasta el techo)",
        "Lámpara de escritorio",
        "Zona de almacenamiento",
      ],
    }

    let prompt = `INSTRUCCIONES ABSOLUTAMENTE CRÍTICAS - LEE ESTO PRIMERO:

🚨 REGLA DE ORO INQUEBRANTABLE 🚨
ESTÁ ABSOLUTAMENTE PROHIBIDO CREAR, AÑADIR, ELIMINAR O MODIFICAR:
- Ventanas (ni una más, ni una menos)
- Puertas (ni una más, ni una menos)  
- Paredes (ni moverlas ni cambiar dimensiones)
- Radiadores (ni añadir ni quitar)
- Estructura arquitectónica de cualquier tipo

SI LA IMAGEN TIENE 1 VENTANA → EL RESULTADO DEBE TENER EXACTAMENTE 1 VENTANA EN EL MISMO LUGAR
SI LA IMAGEN TIENE 2 VENTANAS → EL RESULTADO DEBE TENER EXACTAMENTE 2 VENTANAS EN LOS MISMOS LUGARES
NO INVENTES VENTANAS. NO INVENTES PUERTAS. NO INVENTES NADA ESTRUCTURAL.

════════════════════════════════════════════════════════════════

PASO 1 - ANALIZAR LA ESTRUCTURA ORIGINAL:
- Cuenta EXACTAMENTE cuántas ventanas hay y dónde están ubicadas
- Cuenta EXACTAMENTE cuántas puertas hay y dónde están ubicadas
- Identifica EXACTAMENTE dónde está el radiador
- Memoriza la posición EXACTA de cada elemento estructural
- Esta estructura es SAGRADA y NO PUEDE CAMBIAR

PASO 2 - LIMPIEZA ULTRA AGRESIVA DE TODA LA HABITACIÓN:

🔥 ATENCIÓN ESPECIAL: ZONA DEL RADIADOR 🔥
⚠️ PROBLEMA CRÍTICO DETECTADO: Siempre quedan objetos junto al radiador en la esquina inferior derecha
⚠️ SOLUCIÓN: Hacer 3 PASADAS DE LIMPIEZA en esta zona específica

PASADA 1 - LIMPIEZA GENERAL:
A) ESQUINAS (MÁXIMA PRIORIDAD - REVISAR 3 VECES):
   🔍 ESQUINA INFERIOR DERECHA (ZONA CRÍTICA):
      - Busca objetos junto al radiador
      - Busca herramientas, aspiradoras, cajas, bolsas
      - Busca objetos parcialmente ocultos detrás del radiador
      - Busca objetos en el suelo cerca del radiador
      - ELIMINA TODO lo que no sea el radiador mismo
   
   🔍 ESQUINA INFERIOR IZQUIERDA:
      - Busca y elimina cualquier objeto
   
   🔍 ESQUINA SUPERIOR DERECHA:
      - Busca y elimina cualquier objeto
   
   🔍 ESQUINA SUPERIOR IZQUIERDA:
      - Busca y elimina cualquier objeto

B) BORDES Y PERÍMETRO COMPLETO:
   - Borde inferior: elimina TODOS los objetos
   - Borde superior: elimina TODOS los objetos
   - Borde izquierdo: elimina TODOS los objetos
   - Borde derecho: elimina TODOS los objetos (especialmente cerca del radiador)

C) CENTRO Y ÁREAS PRINCIPALES:
   - Elimina TODOS los muebles existentes
   - Elimina TODOS los objetos decorativos
   - Elimina TODAS las herramientas, botellas, cajas, bolsas, cables
   - Elimina TODOS los textos, medidas, cotas y anotaciones

PASADA 2 - VERIFICACIÓN Y RE-LIMPIEZA:
🔍 Vuelve a revisar ESPECÍFICAMENTE:
   - La zona del radiador (esquina inferior derecha)
   - ¿Hay algún objeto junto al radiador? → ELIMÍNALO
   - ¿Hay algún objeto parcialmente visible? → ELIMÍNALO
   - ¿Hay algún objeto en el suelo cerca? → ELIMÍNALO

PASADA 3 - LIMPIEZA FINAL EXHAUSTIVA:
🔍 Última revisión ULTRA DETALLADA:
   - Revisa pixel por pixel la zona del radiador
   - Revisa todas las esquinas una vez más
   - Revisa todos los bordes una vez más
   - Si encuentras CUALQUIER objeto residual → ELIMÍNALO INMEDIATAMENTE

ELEMENTOS QUE DEBEN PERMANECER (Y SOLO ESTOS):
✓ Paredes, suelo, techo
✓ Ventanas (las que YA existen, en sus posiciones exactas)
✓ Puertas (las que YA existen, en sus posiciones exactas)
✓ Radiadores (los que YA existen, en sus posiciones exactas) - PERO SIN OBJETOS JUNTO A ELLOS
✓ Enchufes e interruptores en las paredes
✓ Iluminación empotrada en el techo

TODO LO DEMÁS DEBE SER ELIMINADO - ESPECIALMENTE OBJETOS JUNTO AL RADIADOR.

PASO 3 - VERIFICACIÓN DE LIMPIEZA (OBLIGATORIA):
❓ ¿Revisé la zona del radiador 3 veces? (OBLIGATORIO: SÍ)
❓ ¿Eliminé TODOS los objetos junto al radiador? (OBLIGATORIO: SÍ)
❓ ¿Eliminé TODOS los objetos de TODAS las esquinas? (OBLIGATORIO: SÍ)
❓ ¿La habitación está COMPLETAMENTE vacía excepto elementos fijos? (OBLIGATORIO: SÍ)
❓ ¿No hay herramientas, aspiradoras, cajas ni objetos visibles? (OBLIGATORIO: SÍ)

Si alguna respuesta es NO, VUELVE AL PASO 2 y limpia de nuevo.

PASO 4 - VERIFICAR ESTRUCTURA (ANTES DE AMUEBLAR):
❓ ¿Mantuve el MISMO número de ventanas? (OBLIGATORIO: SÍ)
❓ ¿Mantuve el MISMO número de puertas? (OBLIGATORIO: SÍ)
❓ ¿Mantuve las MISMAS dimensiones de la habitación? (OBLIGATORIO: SÍ)
❓ ¿El radiador está en su posición original SIN objetos junto a él? (OBLIGATORIO: SÍ)

Si alguna respuesta es NO, DETENTE y corrige.

PASO 5 - AMUEBLAR LA HABITACIÓN:
- Tipo de habitación: ${roomTypeNames[roomType]}
- Estilo de decoración: ${styleNames[style]}

🎯 ELEMENTOS ESENCIALES OBLIGATORIOS PARA ${roomTypeNames[roomType].toUpperCase()}:
${essentialElements[roomType].map((element, index) => `   ${index + 1}. ${element}`).join("\n")}

⚠️ ESTOS ELEMENTOS SON OBLIGATORIOS Y DEBEN ESTAR PRESENTES EN EL RESULTADO FINAL.
⚠️ LA DISTRIBUCIÓN DEBE SER FUNCIONAL Y LÓGICA.

DISTRIBUCIÓN Y COLOCACIÓN:
- CRÍTICO: Muebles altos (armarios, alacenas, estanterías) deben llegar HASTA EL TECHO sin espacios vacíos
- En cocinas: armarios superiores hasta el techo
- En dormitorios: armarios hasta el techo
- Distribuye muebles de forma lógica sin bloquear ventanas ni puertas EXISTENTES
- Añade decoración coherente con estilo ${styleNames[style]}
- Los muebles deben verse naturales y funcionales
- IMPORTANTE: Los muebles nuevos deben cubrir TODA la habitación, incluyendo las esquinas
- ESPECIAL: Coloca muebles estratégicamente para que cubran las zonas donde antes había objetos (especialmente cerca del radiador)`

    if (details) {
      prompt += `\n\nPASO 6 - DETALLES ESPECÍFICOS DEL USUARIO:\n${details}\n(PERO RECUERDA: NO PUEDES AÑADIR NI QUITAR VENTANAS/PUERTAS BAJO NINGUNA CIRCUNSTANCIA)`
    }

    prompt += `\n\n════════════════════════════════════════════════════════════════

RESULTADO FINAL: 
- Render fotorrealista profesional de alta calidad, 8k
- Texturas detalladas y iluminación natural realista
- MISMA estructura arquitectónica que la imagen original (MISMO número de ventanas y puertas)
- Habitación amueblada lista para habitar
- Muebles altos llegando hasta el techo
- SIN OBJETOS RESIDUALES en ninguna esquina o rincón
- ESPECIALMENTE: Sin objetos junto al radiador en la esquina inferior derecha

VERIFICACIÓN FINAL ANTES DE ENTREGAR (CHECKLIST OBLIGATORIA):
✓ ¿Tiene el MISMO número de ventanas que la original? 
✓ ¿Tiene el MISMO número de puertas que la original?
✓ ¿Los muebles altos llegan hasta el techo?
✓ ¿Eliminé TODOS los objetos de TODAS las esquinas?
✓ ¿No hay herramientas, cajas ni objetos residuales visibles?
✓ ¿La zona del radiador está COMPLETAMENTE limpia sin objetos?
✓ ¿No hay objetos "escondidos" en ningún rincón?

Si alguna verificación falla, REHAZ el trabajo completamente desde el PASO 2.`

    const result = await generateText({
      model: "google/gemini-2.5-flash-image-preview",
      providerOptions: {
        google: { responseModalities: ["IMAGE"] },
      },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              image: imageUrl,
            },
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ],
    })

    console.log("[v0] Respuesta de Nano Banana:", JSON.stringify(result, null, 2))

    const imageFiles = result.files?.filter((f) => f.mediaType?.startsWith("image/"))

    if (!imageFiles || imageFiles.length === 0) {
      console.error("[v0] No se generó ninguna imagen")
      throw new Error("No se generó ninguna imagen")
    }

    const generatedImage = imageFiles[0]
    const generatedImageBase64 = `data:${generatedImage.mediaType};base64,${Buffer.from(generatedImage.uint8Array).toString("base64")}`

    const designs = [
      {
        id: Math.random().toString(36).substring(7),
        style,
        imageUrl: generatedImageBase64,
        prompt: `${roomTypeNames[roomType]} en estilo ${styleNames[style]}${details ? ` - ${details}` : ""}`,
      },
    ]

    return NextResponse.json({ designs })
  } catch (error) {
    console.error("[v0] Error generating designs:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al generar diseños" },
      { status: 500 },
    )
  }
}
