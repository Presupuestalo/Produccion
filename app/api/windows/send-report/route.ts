export const dynamic = "force-dynamic"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { Resend } from "resend"
import { groupWindows } from "@/lib/utils/group-windows"

export async function POST(request: Request) {
  try {
    const {
      projectId,
      recipientEmail,
      recipientName,
      windows,
      description,
      projectName: fallbackProjectName,
      projectAddress: fallbackProjectAddress,
      companyPhone: fallbackCompanyPhone,
    } = await request.json()

    if (!recipientEmail || !windows) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 })
    }

    const validWindows = windows.filter((w: any) => w.width > 0 && w.height > 0)

    if (validWindows.length === 0) {
      return NextResponse.json({ error: "No hay ventanas con medidas válidas para enviar" }, { status: 400 })
    }

    const groupedWindows = groupWindows(validWindows)

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

    let projectData = null
    if (projectId) {
      const { data: project } = await supabase
        .from("projects")
        .select("project_name, project_address, city, province")
        .eq("id", projectId)
        .single()
      projectData = project
    }

    const projectName = projectData?.project_name || fallbackProjectName || "Proyecto sin nombre"
    const projectLocation = projectData?.city || projectData?.province || fallbackProjectAddress || "No especificada"

    const { data: userProfile } = await supabase
      .from("profiles")
      .select("company_name, full_name, email, phone")
      .eq("id", session.user.id)
      .single()

    const { data: companySettings } = await supabase
      .from("user_company_settings")
      .select("company_name, company_phone")
      .eq("user_id", session.user.id)
      .single()

    const companyName =
      companySettings?.company_name || userProfile?.company_name || userProfile?.full_name || "Un cliente"
    const contactEmail = userProfile?.email || session.user.email
    const contactPhone =
      companySettings?.company_phone || fallbackCompanyPhone || userProfile?.phone || "No proporcionado"

    const glassTypeDisplayMap: Record<string, string> = {
      Sencillo: "Ventana Sencilla",
      Doble: "Ventana Doble",
      "Puerta Balcón": "Puerta de Balcón",
    }

    const windowsList = groupedWindows
      .map((group, index) => {
        const w = group.window
        const extras = []
        if (w.hasBlind) extras.push("Persiana")
        if (w.hasFixedPanel) extras.push("Fijo")
        if (w.hasMotor) extras.push("Motor Eléctrico")
        if (w.hasMosquitera) extras.push("Mosquitera")
        if (w.hasCatFlap) extras.push("Gatera")

        const displayType = glassTypeDisplayMap[w.glassType] || w.glassType || "No especificado"
        const quantityLabel = group.quantity > 1 ? `${group.quantity} x ` : ""
        const roomsLabel = group.rooms.length > 0 ? ` (${group.rooms.join(", ")})` : ""

        return `
${quantityLabel}VENTANA${group.quantity > 1 ? "S" : ""} ${index + 1}${roomsLabel}
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
â€¢ Tipo: ${displayType}
â€¢ Abertura: ${w.type || "No especificado"}
â€¢ Material: ${w.material || "No especificado"}
â€¢ Dimensiones: ${w.width}m (ancho) í— ${w.height}m (alto)
â€¢ Color Interior: ${w.innerColor || "Blanco"}
â€¢ Color Exterior: ${w.outerColor || "Blanco"}
â€¢ Extras: ${extras.length > 0 ? extras.join(", ") : "Ninguno"}
${group.quantity > 1 ? `â€¢ Cantidad: ${group.quantity} unidades` : ""}
`
      })
      .join("\n")

    const descriptionText = description ? `\nNOTAS ADICIONALES:\n${description}\n` : ""

    const emailText = `
Estimado/a ${recipientName || "profesional"},

La empresa ${companyName} solicita un presupuesto para la instalación de ventanas con las siguientes especificaciones:

â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
DATOS DEL PROYECTO
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
â€¢ Nombre: ${projectName}
â€¢ Ubicación: ${projectLocation}
â€¢ Total de ventanas: ${validWindows.length}
â€¢ Tipos diferentes: ${groupedWindows.length}
${descriptionText}
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
DETALLE DE VENTANAS
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
${windowsList}
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
DATOS DE CONTACTO
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
â€¢ Empresa: ${companyName}
â€¢ Email: ${contactEmail}
â€¢ Teléfono: ${contactPhone}

Por favor, envíe su presupuesto a la dirección de email indicada.

Gracias por su atención.

---
Este mensaje ha sido enviado desde Presupuéstalo
www.presupuestalo.com
`

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
    .header { background: #d97706; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .section { background: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 5px; }
    .window { background: white; padding: 15px; margin: 10px 0; border-left: 3px solid #d97706; }
    .window-title { font-weight: bold; color: #d97706; margin-bottom: 10px; }
    .quantity-badge { background: #d97706; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-left: 8px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Solicitud de Presupuesto de Ventanas</h1>
  </div>
  <div class="content">
    <p>Estimado/a <strong>${recipientName || "profesional"}</strong>,</p>
    <p>La empresa <strong>${companyName}</strong> solicita un presupuesto para la instalación de ventanas con las siguientes especificaciones:</p>
    
    <div class="section">
      <h3>Datos del Proyecto</h3>
      <p><strong>Nombre:</strong> ${projectName}</p>
      <p><strong>Ubicación:</strong> ${projectLocation}</p>
      <p><strong>Total de ventanas:</strong> ${validWindows.length}</p>
      <p><strong>Tipos diferentes:</strong> ${groupedWindows.length}</p>
    </div>
    
    ${description ? `<div class="section"><h3>Notas adicionales</h3><p>${description.replace(/\n/g, "<br>")}</p></div>` : ""}
    
    <h3>Detalle de Ventanas</h3>
    ${groupedWindows
        .map((group, i) => {
          const w = group.window
          const extras = []
          if (w.hasBlind) extras.push("Persiana")
          if (w.hasFixedPanel) extras.push("Fijo")
          if (w.hasMotor) extras.push("Motor Eléctrico")
          if (w.hasMosquitera) extras.push("Mosquitera")
          if (w.hasCatFlap) extras.push("Gatera")
          const displayType = glassTypeDisplayMap[w.glassType] || w.glassType || "No especificado"
          const roomsLabel = group.rooms.length > 0 ? ` - ${group.rooms.join(", ")}` : ""

          return `
      <div class="window">
        <div class="window-title">
          Ventana ${i + 1}${roomsLabel}
          ${group.quantity > 1 ? `<span class="quantity-badge">${group.quantity} uds.</span>` : ""}
        </div>
        <strong>Tipo:</strong> ${displayType}<br>
        <strong>Abertura:</strong> ${w.type || "No especificado"}<br>
        <strong>Material:</strong> ${w.material || "No especificado"}<br>
        <strong>Dimensiones:</strong> ${w.width}m í— ${w.height}m<br>
        <strong>Color Interior:</strong> ${w.innerColor || "Blanco"}<br>
        <strong>Color Exterior:</strong> ${w.outerColor || "Blanco"}<br>
        <strong>Extras:</strong> ${extras.length > 0 ? extras.join(", ") : "Ninguno"}
      </div>
    `
        })
        .join("")}
    
    <div class="section">
      <h3>Datos de Contacto</h3>
      <p><strong>Empresa:</strong> ${companyName}</p>
      <p><strong>Email:</strong> ${contactEmail}</p>
      <p><strong>Teléfono:</strong> ${contactPhone}</p>
    </div>
    
    <p>Por favor, envíe su presupuesto a la dirección de email indicada.</p>
    <p>Gracias por su atención.</p>
  </div>
  <div class="footer">
    <p>Este mensaje ha sido enviado desde Presupuéstalo<br>www.presupuestalo.com</p>
  </div>
</body>
</html>
`

    const resend = new Resend(process.env.RESEND_API_KEY)

    const { data, error } = await resend.emails.send({
      from: "Presupuéstalo <noreply@presupuestalo.com>",
      to: recipientEmail,
      subject: `Presupuesto ventanas - ${projectName}`,
      text: emailText,
      html: emailHtml,
    })

    if (error) {
      console.error("Error Resend:", error)
      return NextResponse.json({ error: `Error al enviar: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: data?.id })
  } catch (error: any) {
    console.error("Error sending window report:", error)
    return NextResponse.json({ error: error.message || "Error inesperado" }, { status: 500 })
  }
}

