export const dynamic = "force-dynamic"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateText } from "ai"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: "Configuración de servidor incompleta" }, { status: 500 })
    }

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
      return NextResponse.json({ error: "Imagen, tipo de habitaciÃ³n y estilo son requeridos" }, { status: 400 })
    }

    const bytes = await image.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString("base64")
    const mimeType = image.type || "image/png"
    const imageUrl = `data:${mimeType};base64,${base64}`

    console.log("[v0] Validando que sea una sola habitaciÃ³n...")

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
              - La imagen muestra UNA habitaciÃ³n individual (puede estar vacÃ­a o con objetos)
              - Es un espacio interior con paredes, suelo y techo visibles
              - Tiene ventanas, puertas o elementos arquitectÃ³nicos de una habitaciÃ³n
              - Es una fotografÃ­a o render 3D de un espacio interior real
              
              Responde "NO" SOLO si:
              - Muestra claramente MÃšLTIPLES habitaciones diferentes al mismo tiempo
              - Es un plano arquitectÃ³nico 2D completo de varias habitaciones
              - Es un espacio completamente exterior (jardÃ­n, terraza sin techo)
              - No es una imagen de un espacio interior
              
              IMPORTANTE: Una habitaciÃ³n vacÃ­a con paredes, ventanas y suelo ES VÃLIDA.
              
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
            "La imagen debe mostrar UNA SOLA habitaciÃ³n. Por favor, sube una imagen de una habitaciÃ³n individual, no un plano completo con mÃºltiples habitaciones.",
        },
        { status: 400 },
      )
    }

    console.log("[v0] ValidaciÃ³n exitosa, generando diseÃ±o...")

    const roomTypeNames: Record<string, string> = {
      bedroom: "dormitorio",
      living: "salÃ³n",
      kitchen: "cocina",
      bathroom: "baÃ±o",
      dining: "comedor",
      office: "oficina",
    }

    const styleNames: Record<string, string> = {
      modern: "moderno",
      industrial: "industrial",
      scandinavian: "escandinavo",
      rustic: "rÃºstico",
      contemporary: "contemporÃ¡neo",
      minimalist: "minimalista",
    }

    const essentialElements: Record<string, string[]> = {
      bedroom: [
        "Cama (elemento central y principal)",
        "Armario o closet empotrado (debe llegar hasta el techo)",
        "Mesitas de noche a ambos lados de la cama",
        "LÃ¡mpara de techo o lÃ¡mparas de mesita",
      ],
      living: [
        "TelevisiÃ³n montada en la pared o sobre mueble",
        "SofÃ¡ enfrentado DIRECTAMENTE a la televisiÃ³n para poder verla",
        "Mesa de centro delante del sofÃ¡",
        "Mueble bajo la TV o estanterÃ­a",
        "IluminaciÃ³n ambiental",
      ],
      kitchen: [
        "Encimera de cocina con zona de trabajo",
        "Armarios superiores (hasta el techo) e inferiores",
        "Fregadero integrado en la encimera",
        "Placa de cocciÃ³n/vitrocerÃ¡mica",
        "Campana extractora sobre la placa",
        "Nevera/frigorÃ­fico",
        "Horno integrado",
      ],
      bathroom: [
        "Inodoro",
        "Lavabo con mueble o encimera",
        "Ducha o baÃ±era",
        "Espejo sobre el lavabo",
        "Toallero",
        "Mueble de almacenamiento",
      ],
      dining: [
        "Mesa de comedor (elemento central)",
        "Sillas alrededor de la mesa (mÃ­nimo 4)",
        "Aparador o mueble auxiliar",
        "LÃ¡mpara colgante sobre la mesa",
      ],
      office: [
        "Escritorio (elemento principal)",
        "Silla de oficina ergonÃ³mica",
        "EstanterÃ­as o librerÃ­a (hasta el techo)",
        "LÃ¡mpara de escritorio",
        "Zona de almacenamiento",
      ],
    }

    let prompt = `INSTRUCCIONES ABSOLUTAMENTE CRÃTICAS - LEE ESTO PRIMERO:

ðŸš¨ REGLA DE ORO INQUEBRANTABLE ðŸš¨
ESTÃ ABSOLUTAMENTE PROHIBIDO CREAR, AÃ‘ADIR, ELIMINAR O MODIFICAR:
- Ventanas (ni una mÃ¡s, ni una menos)
- Puertas (ni una mÃ¡s, ni una menos)  
- Paredes (ni moverlas ni cambiar dimensiones)
- Radiadores (ni aÃ±adir ni quitar)
- Estructura arquitectÃ³nica de cualquier tipo

SI LA IMAGEN TIENE 1 VENTANA â†’ EL RESULTADO DEBE TENER EXACTAMENTE 1 VENTANA EN EL MISMO LUGAR
SI LA IMAGEN TIENE 2 VENTANAS â†’ EL RESULTADO DEBE TENER EXACTAMENTE 2 VENTANAS EN LOS MISMOS LUGARES
NO INVENTES VENTANAS. NO INVENTES PUERTAS. NO INVENTES NADA ESTRUCTURAL.

â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

PASO 1 - ANALIZAR LA ESTRUCTURA ORIGINAL:
- Cuenta EXACTAMENTE cuÃ¡ntas ventanas hay y dÃ³nde estÃ¡n ubicadas
- Cuenta EXACTAMENTE cuÃ¡ntas puertas hay y dÃ³nde estÃ¡n ubicadas
- Identifica EXACTAMENTE dÃ³nde estÃ¡ el radiador
- Memoriza la posiciÃ³n EXACTA de cada elemento estructural
- Esta estructura es SAGRADA y NO PUEDE CAMBIAR

PASO 2 - LIMPIEZA ULTRA AGRESIVA DE TODA LA HABITACIÃ“N:

ðŸ”¥ ATENCIÃ“N ESPECIAL: ZONA DEL RADIADOR ðŸ”¥
âš ï¸ PROBLEMA CRÃTICO DETECTADO: Siempre quedan objetos junto al radiador en la esquina inferior derecha
âš ï¸ SOLUCIÃ“N: Hacer 3 PASADAS DE LIMPIEZA en esta zona especÃ­fica

PASADA 1 - LIMPIEZA GENERAL:
A) ESQUINAS (MÃXIMA PRIORIDAD - REVISAR 3 VECES):
   ðŸ” ESQUINA INFERIOR DERECHA (ZONA CRÃTICA):
      - Busca objetos junto al radiador
      - Busca herramientas, aspiradoras, cajas, bolsas
      - Busca objetos parcialmente ocultos detrÃ¡s del radiador
      - Busca objetos en el suelo cerca del radiador
      - ELIMINA TODO lo que no sea el radiador mismo
   
   ðŸ” ESQUINA INFERIOR IZQUIERDA:
      - Busca y elimina cualquier objeto
   
   ðŸ” ESQUINA SUPERIOR DERECHA:
      - Busca y elimina cualquier objeto
   
   ðŸ” ESQUINA SUPERIOR IZQUIERDA:
      - Busca y elimina cualquier objeto

B) BORDES Y PERÃMETRO COMPLETO:
   - Borde inferior: elimina TODOS los objetos
   - Borde superior: elimina TODOS los objetos
   - Borde izquierdo: elimina TODOS los objetos
   - Borde derecho: elimina TODOS los objetos (especialmente cerca del radiador)

C) CENTRO Y ÃREAS PRINCIPALES:
   - Elimina TODOS los muebles existentes
   - Elimina TODOS los objetos decorativos
   - Elimina TODAS las herramientas, botellas, cajas, bolsas, cables
   - Elimina TODOS los textos, medidas, cotas y anotaciones

PASADA 2 - VERIFICACIÃ“N Y RE-LIMPIEZA:
ðŸ” Vuelve a revisar ESPECÃFICAMENTE:
   - La zona del radiador (esquina inferior derecha)
   - Â¿Hay algÃºn objeto junto al radiador? â†’ ELIMÃNALO
   - Â¿Hay algÃºn objeto parcialmente visible? â†’ ELIMÃNALO
   - Â¿Hay algÃºn objeto en el suelo cerca? â†’ ELIMÃNALO

PASADA 3 - LIMPIEZA FINAL EXHAUSTIVA:
ðŸ” Ãšltima revisiÃ³n ULTRA DETALLADA:
   - Revisa pixel por pixel la zona del radiador
   - Revisa todas las esquinas una vez mÃ¡s
   - Revisa todos los bordes una vez mÃ¡s
   - Si encuentras CUALQUIER objeto residual â†’ ELIMÃNALO INMEDIATAMENTE

ELEMENTOS QUE DEBEN PERMANECER (Y SOLO ESTOS):
âœ“ Paredes, suelo, techo
âœ“ Ventanas (las que YA existen, en sus posiciones exactas)
âœ“ Puertas (las que YA existen, en sus posiciones exactas)
âœ“ Radiadores (los que YA existen, en sus posiciones exactas) - PERO SIN OBJETOS JUNTO A ELLOS
âœ“ Enchufes e interruptores en las paredes
âœ“ IluminaciÃ³n empotrada en el techo

TODO LO DEMÃS DEBE SER ELIMINADO - ESPECIALMENTE OBJETOS JUNTO AL RADIADOR.

PASO 3 - VERIFICACIÃ“N DE LIMPIEZA (OBLIGATORIA):
â“ Â¿RevisÃ© la zona del radiador 3 veces? (OBLIGATORIO: SÃ)
â“ Â¿EliminÃ© TODOS los objetos junto al radiador? (OBLIGATORIO: SÃ)
â“ Â¿EliminÃ© TODOS los objetos de TODAS las esquinas? (OBLIGATORIO: SÃ)
â“ Â¿La habitaciÃ³n estÃ¡ COMPLETAMENTE vacÃ­a excepto elementos fijos? (OBLIGATORIO: SÃ)
â“ Â¿No hay herramientas, aspiradoras, cajas ni objetos visibles? (OBLIGATORIO: SÃ)

Si alguna respuesta es NO, VUELVE AL PASO 2 y limpia de nuevo.

PASO 4 - VERIFICAR ESTRUCTURA (ANTES DE AMUEBLAR):
â“ Â¿Mantuve el MISMO nÃºmero de ventanas? (OBLIGATORIO: SÃ)
â“ Â¿Mantuve el MISMO nÃºmero de puertas? (OBLIGATORIO: SÃ)
â“ Â¿Mantuve las MISMAS dimensiones de la habitaciÃ³n? (OBLIGATORIO: SÃ)
â“ Â¿El radiador estÃ¡ en su posiciÃ³n original SIN objetos junto a Ã©l? (OBLIGATORIO: SÃ)

Si alguna respuesta es NO, DETENTE y corrige.

PASO 5 - AMUEBLAR LA HABITACIÃ“N:
- Tipo de habitaciÃ³n: ${roomTypeNames[roomType]}
- Estilo de decoraciÃ³n: ${styleNames[style]}

ðŸŽ¯ ELEMENTOS ESENCIALES OBLIGATORIOS PARA ${roomTypeNames[roomType].toUpperCase()}:
${essentialElements[roomType].map((element, index) => `   ${index + 1}. ${element}`).join("\n")}

âš ï¸ ESTOS ELEMENTOS SON OBLIGATORIOS Y DEBEN ESTAR PRESENTES EN EL RESULTADO FINAL.
âš ï¸ LA DISTRIBUCIÃ“N DEBE SER FUNCIONAL Y LÃ“GICA.

DISTRIBUCIÃ“N Y COLOCACIÃ“N:
- CRÃTICO: Muebles altos (armarios, alacenas, estanterÃ­as) deben llegar HASTA EL TECHO sin espacios vacÃ­os
- En cocinas: armarios superiores hasta el techo
- En dormitorios: armarios hasta el techo
- Distribuye muebles de forma lÃ³gica sin bloquear ventanas ni puertas EXISTENTES
- AÃ±ade decoraciÃ³n coherente con estilo ${styleNames[style]}
- Los muebles deben verse naturales y funcionales
- IMPORTANTE: Los muebles nuevos deben cubrir TODA la habitaciÃ³n, incluyendo las esquinas
- ESPECIAL: Coloca muebles estratÃ©gicamente para que cubran las zonas donde antes habÃ­a objetos (especialmente cerca del radiador)`

    if (details) {
      prompt += `\n\nPASO 6 - DETALLES ESPECÃFICOS DEL USUARIO:\n${details}\n(PERO RECUERDA: NO PUEDES AÃ‘ADIR NI QUITAR VENTANAS/PUERTAS BAJO NINGUNA CIRCUNSTANCIA)`
    }

    prompt += `\n\nâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

RESULTADO FINAL: 
- Render fotorrealista profesional de alta calidad, 8k
- Texturas detalladas y iluminaciÃ³n natural realista
- MISMA estructura arquitectÃ³nica que la imagen original (MISMO nÃºmero de ventanas y puertas)
- HabitaciÃ³n amueblada lista para habitar
- Muebles altos llegando hasta el techo
- SIN OBJETOS RESIDUALES en ninguna esquina o rincÃ³n
- ESPECIALMENTE: Sin objetos junto al radiador en la esquina inferior derecha

VERIFICACIÃ“N FINAL ANTES DE ENTREGAR (CHECKLIST OBLIGATORIA):
âœ“ Â¿Tiene el MISMO nÃºmero de ventanas que la original? 
âœ“ Â¿Tiene el MISMO nÃºmero de puertas que la original?
âœ“ Â¿Los muebles altos llegan hasta el techo?
âœ“ Â¿EliminÃ© TODOS los objetos de TODAS las esquinas?
âœ“ Â¿No hay herramientas, cajas ni objetos residuales visibles?
âœ“ Â¿La zona del radiador estÃ¡ COMPLETAMENTE limpia sin objetos?
âœ“ Â¿No hay objetos "escondidos" en ningÃºn rincÃ³n?

Si alguna verificaciÃ³n falla, REHAZ el trabajo completamente desde el PASO 2.`

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
      console.error("[v0] No se generÃ³ ninguna imagen")
      throw new Error("No se generÃ³ ninguna imagen")
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
      { error: error instanceof Error ? error.message : "Error al generar diseÃ±os" },
      { status: 500 },
    )
  }
}

