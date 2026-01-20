import { groupWindows } from "@/lib/utils/group-windows"

interface WindowData {
  id: string
  room: string
  roomName?: string
  width: number
  height: number
  type: string
  glassType?: string
  material?: string
  innerColor?: string
  outerColor?: string
  hasBlind?: boolean
  hasFixedPanel?: boolean
  hasMotor?: boolean
  hasMosquitera?: boolean
  hasCatFlap?: boolean
  photos: Array<{ photo_url: string }>
}

interface GenerateReportParams {
  projectName: string
  recipientName: string
  windows: WindowData[]
}

const glassTypeDisplayMap: Record<string, string> = {
  Sencillo: "Ventana Sencilla",
  Doble: "Ventana Doble",
  "Puerta Balcón": "Puerta de Balcón",
}

export function generateWindowReportPDF(params: GenerateReportParams): string {
  const { projectName, recipientName, windows } = params

  const validWindows = windows.filter((w) => w.width > 0 && w.height > 0)
  const groupedWindows = groupWindows(validWindows)

  const windowsHTML = groupedWindows
    .map((group, index) => {
      const window = group.window
      const extras = []
      if (window.hasBlind) extras.push("Persiana")
      if (window.hasFixedPanel) extras.push("Fijo")
      if (window.hasMotor) extras.push("Motor Eléctrico")
      if (window.hasMosquitera) extras.push("Mosquitera")
      if (window.hasCatFlap) extras.push("Gatera")

      const displayType =
        glassTypeDisplayMap[window.glassType || ""] || window.glassType || window.type || "No especificado"

      const roomsLabel = group.rooms.length > 0 ? group.rooms.join(", ") : window.room || "Sin ubicación"
      const quantityBadge =
        group.quantity > 1
          ? `<span style="background: #ea580c; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; margin-left: 8px;">${group.quantity} uds.</span>`
          : ""

      return `
    <div style="margin-bottom: 20px; page-break-inside: avoid;">
      <h3 style="margin: 0 0 10px 0; color: #333; font-size: 14px;">
        Ventana ${index + 1} - ${roomsLabel}${quantityBadge}
      </h3>
      <div style="background-color: #f5f5f5; padding: 12px; border-radius: 4px; margin-bottom: 10px;">
        <p style="margin: 0 0 8px 0;"><strong>Ubicación:</strong> ${roomsLabel}</p>
        <p style="margin: 0 0 8px 0;"><strong>Tipo:</strong> ${displayType}</p>
        <p style="margin: 0 0 8px 0;"><strong>Abertura:</strong> ${window.type || "No especificado"}</p>
        <p style="margin: 0 0 8px 0;"><strong>Dimensiones:</strong> ${window.width}m x ${window.height}m</p>
        <p style="margin: 0 0 8px 0;"><strong>Material:</strong> ${window.material || "No especificado"}</p>
        <p style="margin: 0 0 8px 0;"><strong>Color Interior:</strong> ${window.innerColor || "Blanco"}</p>
        <p style="margin: 0 0 8px 0;"><strong>Color Exterior:</strong> ${window.outerColor || "Blanco"}</p>
        <p style="margin: 0 0 8px 0;"><strong>Extras:</strong> ${extras.length > 0 ? extras.join(", ") : "Ninguno"}</p>
        ${group.quantity > 1 ? `<p style="margin: 0 0 0 0;"><strong>Cantidad:</strong> ${group.quantity} unidades</p>` : ""}
      </div>
      ${
        window.photos && window.photos.length > 0
          ? `
        <div style="margin-top: 10px;">
          <p style="margin: 0 0 8px 0; font-weight: bold; color: #333;">Fotos:</p>
          <div style="display: flex; flex-wrap: wrap; gap: 10px;">
            ${window.photos
              .map(
                (photo) => `
              <div style="width: 45%; min-width: 150px;">
                <img src="${photo.photo_url}" style="width: 100%; height: auto; border: 1px solid #ddd; border-radius: 4px;" alt="Foto ventana" />
              </div>
            `,
              )
              .join("")}
          </div>
        </div>
      `
          : '<p style="color: #999; font-style: italic; margin-top: 10px;">Sin fotos</p>'
      }
    </div>
  `
    })
    .join("")

  return `
    <!DOCTYPE html>
    <html style="font-family: Arial, sans-serif; color: #333;">
    <head>
      <meta charset="UTF-8" />
      <style>
        body {
          margin: 0;
          padding: 20px;
          font-size: 12px;
          line-height: 1.5;
        }
        h1 {
          margin: 0 0 5px 0;
          font-size: 24px;
          color: #ea580c;
        }
        h2 {
          margin: 0 0 10px 0;
          font-size: 18px;
          color: #333;
          border-bottom: 2px solid #ea580c;
          padding-bottom: 8px;
        }
        h3 {
          margin: 0 0 10px 0;
          font-size: 14px;
          color: #333;
        }
        p {
          margin: 0 0 10px 0;
        }
        .header {
          border-bottom: 2px solid #ea580c;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }
        .summary {
          background: #f5f5f5;
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 20px;
        }
        .footer {
          margin-top: 40px;
          border-top: 1px solid #ddd;
          padding-top: 15px;
          font-size: 10px;
          color: #666;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
        }
        td {
          padding: 8px;
          border: 1px solid #ddd;
        }
        img {
          max-width: 100%;
          height: auto;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Informe de Ventanas</h1>
        ${projectName ? `<p><strong>Proyecto:</strong> ${projectName}</p>` : ""}
        ${recipientName ? `<p><strong>Cliente:</strong> ${recipientName}</p>` : ""}
      </div>

      <div class="summary">
        <p><strong>Total de ventanas:</strong> ${validWindows.length}</p>
        <p><strong>Tipos diferentes:</strong> ${groupedWindows.length}</p>
      </div>

      <h2>Detalle de Ventanas</h2>
      <p>Se adjunta a continuación el detalle de todas las ventanas del proyecto con sus características y fotos.</p>

      <div style="margin-top: 20px;">
        ${windowsHTML}
      </div>

      <div class="footer">
        <p>Informe generado por Presupuéstalo</p>
        <p>Para más información, visita: www.presupuestalo.com</p>
      </div>
    </body>
    </html>
  `
}
