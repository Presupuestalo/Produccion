export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { Resend } from "resend"
import { groupWindows } from "@/lib/utils/group-windows"

const resend = new Resend(process.env.RESEND_API_KEY)

const glassTypeMap: Record<string, string> = {
  Sencillo: "Ventana Sencilla",
  Doble: "Ventana Doble",
  "Puerta Balcón": "Puerta de Balcón",
}

export async function POST(request: Request) {
  try {
    const { projectName, homeownerEmail, homeownerName, windows, projectAddress, companyName, companyPhone } =
      await request.json()

    if (!homeownerEmail || !windows) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 })
    }

    const validWindows = windows.filter((w: any) => w.width && w.height && Number(w.width) > 0 && Number(w.height) > 0)

    if (validWindows.length === 0) {
      return NextResponse.json({ error: "No hay ventanas con medidas válidas" }, { status: 400 })
    }

    const groupedWindows = groupWindows(validWindows)

    const empresaNombre = companyName || homeownerName || "Cliente"

    const windowsSummary = groupedWindows
      .map((group, i) => {
        const w = group.window
        const tipo = glassTypeMap[w.glassType] || w.glassType || "No especificado"
        const abertura = w.type || "No especificada"
        const ancho = w.width || "?"
        const alto = w.height || "?"
        const material = w.material || "No especificado"
        const colorInt = w.innerColor || "No especificado"
        const colorExt = w.outerColor || "No especificado"
        const persiana = w.hasBlind ? "Sí" : "No"
        const fijo = w.hasFixedPanel ? "Sí" : "No"
        const motor = w.hasMotor ? "Sí" : "No"
        const mosquitera = w.hasMosquitera ? "Sí" : "No"
        const gatera = w.hasCatFlap ? "Sí" : "No"
        const quantityLabel = group.quantity > 1 ? `${group.quantity} x ` : ""
        const roomsLabel = group.rooms.length > 0 ? ` (${group.rooms.join(", ")})` : ""

        return `
${quantityLabel}Ventana ${i + 1}${roomsLabel}
  â€¢ Tipo: ${tipo}
  â€¢ Abertura: ${abertura}
  â€¢ Dimensiones: ${ancho}m (ancho) í— ${alto}m (alto)
  â€¢ Material: ${material}
  â€¢ Color Interior: ${colorInt}
  â€¢ Color Exterior: ${colorExt}
  â€¢ Persiana: ${persiana}
  â€¢ Fijo: ${fijo}
  â€¢ Motor Eléctrico: ${motor}
  â€¢ Mosquitera: ${mosquitera}
  â€¢ Gatera: ${gatera}
${group.quantity > 1 ? `  â€¢ Cantidad: ${group.quantity} unidades` : ""}
`
      })
      .join("\n")

    // Email para el propietario
    const homeownerHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          h1 { color: #2c3e50; }
          .success-box { background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>âœ“ Solicitud de Cotización Recibida</h1>
        <div class="success-box">
          <p>Estimado/a <strong>${empresaNombre}</strong>,</p>
          <p>Hemos recibido tu solicitud de cotización para las ventanas de tu proyecto.</p>
          <p>Nos pondremos en contacto contigo en breve con un presupuesto personalizado.</p>
        </div>
        <p><strong>Detalles del proyecto:</strong></p>
        <ul>
          <li>Proyecto: ${projectName || "No especificado"}</li>
          <li>Ubicación: ${projectAddress || "No especificada"}</li>
          <li>Total de ventanas: ${validWindows.length}</li>
          <li>Tipos diferentes: ${groupedWindows.length}</li>
        </ul>
        <div class="footer">
          <p>Presupuéstalo - Tu solución de presupuestos online</p>
        </div>
      </body>
      </html>
    `

    const adminText = `
NUEVA SOLICITUD DE COTIZACIí“N - VENTANAS
==========================================

DATOS DEL SOLICITANTE:
- Empresa/Nombre: ${empresaNombre}
- Email: ${homeownerEmail}
- Teléfono: ${companyPhone || "No especificado"}

DATOS DEL PROYECTO:
- Nombre: ${projectName || "No especificado"}
- Ubicación: ${projectAddress || "No especificada"}
- Total de ventanas: ${validWindows.length}
- Tipos diferentes: ${groupedWindows.length}

==========================================
DETALLE DE VENTANAS:
==========================================
${windowsSummary}

==========================================
Solicitud enviada desde Presupuéstalo
    `.trim()

    const adminHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
          .header { background: #e65c00; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .section { margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; }
          .section-title { font-weight: bold; color: #e65c00; margin-bottom: 10px; border-bottom: 2px solid #e65c00; padding-bottom: 5px; }
          .window-card { background: white; border: 1px solid #ddd; border-radius: 6px; padding: 12px; margin-bottom: 10px; }
          .window-title { font-weight: bold; color: #333; margin-bottom: 8px; }
          .window-detail { font-size: 13px; color: #555; margin: 4px 0; }
          .quantity-badge { background: #e65c00; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; margin-left: 8px; }
          .footer { text-align: center; color: #888; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="margin: 0;">Nueva Solicitud de Cotización</h1>
          <p style="margin: 5px 0 0 0;">Ventanas - ${validWindows.length} unidades (${groupedWindows.length} tipos)</p>
        </div>
        <div class="content">
          <div class="section">
            <div class="section-title">Datos del Solicitante</div>
            <p><strong>Empresa/Nombre:</strong> ${empresaNombre}</p>
            <p><strong>Email:</strong> ${homeownerEmail}</p>
            <p><strong>Teléfono:</strong> ${companyPhone || "No especificado"}</p>
          </div>
          
          <div class="section">
            <div class="section-title">Datos del Proyecto</div>
            <p><strong>Proyecto:</strong> ${projectName || "No especificado"}</p>
            <p><strong>Ubicación:</strong> ${projectAddress || "No especificada"}</p>
          </div>
          
          <div class="section">
            <div class="section-title">Detalle de Ventanas (${validWindows.length} uds. / ${groupedWindows.length} tipos)</div>
            ${groupedWindows
              .map((group, i) => {
                const w = group.window
                const roomsLabel = group.rooms.length > 0 ? ` - ${group.rooms.join(", ")}` : ""
                return `
              <div class="window-card">
                <div class="window-title">
                  Ventana ${i + 1}${roomsLabel}
                  ${group.quantity > 1 ? `<span class="quantity-badge">${group.quantity} uds.</span>` : ""}
                </div>
                <div class="window-detail"><strong>Tipo:</strong> ${glassTypeMap[w.glassType] || w.glassType || "No especificado"}</div>
                <div class="window-detail"><strong>Abertura:</strong> ${w.type || "No especificada"}</div>
                <div class="window-detail"><strong>Dimensiones:</strong> ${w.width || "?"}m í— ${w.height || "?"}m</div>
                <div class="window-detail"><strong>Material:</strong> ${w.material || "No especificado"}</div>
                <div class="window-detail"><strong>Color Interior:</strong> ${w.innerColor || "No especificado"}</div>
                <div class="window-detail"><strong>Color Exterior:</strong> ${w.outerColor || "No especificado"}</div>
                <div class="window-detail"><strong>Persiana:</strong> ${w.hasBlind ? "Sí" : "No"} | <strong>Fijo:</strong> ${w.hasFixedPanel ? "Sí" : "No"} | <strong>Motor:</strong> ${w.hasMotor ? "Sí" : "No"} | <strong>Mosquitera:</strong> ${w.hasMosquitera ? "Sí" : "No"} | <strong>Gatera:</strong> ${w.hasCatFlap ? "Sí" : "No"}</div>
              </div>
            `
              })
              .join("")}
          </div>
        </div>
        <div class="footer">
          <p>Solicitud enviada desde Presupuéstalo</p>
        </div>
      </body>
      </html>
    `

    // Enviar email al propietario
    const { error: homeownerError } = await resend.emails.send({
      from: "Presupuéstalo <noreply@presupuestalo.com>",
      to: [homeownerEmail],
      subject: "Solicitud de Cotización Recibida - Presupuéstalo",
      html: homeownerHtml,
    })

    if (homeownerError) {
      console.error("Error enviando email al cliente:", homeownerError)
    }

    // Enviar email al equipo admin
    const { error: adminError } = await resend.emails.send({
      from: "Presupuéstalo <noreply@presupuestalo.com>",
      to: ["presupuestaloficial@gmail.com"],
      subject: `Nueva Solicitud Cotización Ventanas - ${empresaNombre}`,
      text: adminText,
      html: adminHtml,
    })

    if (adminError) {
      console.error("Error enviando email admin:", adminError)
      return NextResponse.json({ error: adminError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error en request-quote:", error)
    return NextResponse.json({ error: error.message || "Error inesperado" }, { status: 500 })
  }
}

