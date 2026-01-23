// Templates de email para Presmarket

const baseStyles = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  max-width: 650px;
  margin: 0 auto;
  padding: 10px;
  background-color: #f3f4f6;
`

const containerStyles = `
  background-color: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`

const headerStyles = `
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  padding: 30px;
  text-align: center;
  border-radius: 8px 8px 0 0;
`

const contentStyles = `
  padding: 30px;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-top: none;
  border-radius: 0 0 8px 8px;
`

const buttonStyles = `
  display: inline-block;
  padding: 12px 24px;
  background-color: #f97316;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 600;
  margin: 20px 0;
`

const footerStyles = `
  text-align: center;
  padding: 20px;
  color: #6b7280;
  font-size: 12px;
`

// Template: Notificación al propietario cuando un profesional compra su lead
export function professionalInterestedTemplate(data: {
  ownerName: string
  professionalName: string
  professionalCompany?: string
  projectType: string
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="${baseStyles}">
      <div style="${containerStyles}">
        <div style="${headerStyles}">
          <h1 style="color: white; margin: 0; font-size: 24px;">¡Un profesional quiere contactarte!</h1>
        </div>
        <div style="${contentStyles}">
        <p style="font-size: 16px; color: #374151;">Hola ${data.ownerName},</p>
        <p style="font-size: 16px; color: #374151;">
          Buenas noticias: <strong>${data.professionalName}</strong>${data.professionalCompany ? ` de ${data.professionalCompany}` : ""} 
          ha mostrado interés en tu proyecto de <strong>${data.projectType}</strong> y se pondrá en contacto contigo pronto.
        </p>
        <div style="background-color: #fef3c7; border-left: 4px solid #f97316; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            <strong>Consejo:</strong> Mantén tu teléfono disponible y revisa tu email. 
            El profesional intentará contactarte en las próximas horas.
          </p>
        </div>
        <p style="font-size: 14px; color: #6b7280;">
          Si tienes alguna pregunta, no dudes en contactarnos.
        </p>
        </div>
      </div>
      <div style="${footerStyles}">
        <p>© ${new Date().getFullYear()} Presupuéstalo. Todos los derechos reservados.</p>
      </div>
    </body>
    </html>
  `
}

// Template: Confirmación al profesional con datos del cliente
export function leadAccessConfirmationTemplate(data: {
  professionalName: string
  ownerName: string
  ownerPhone: string
  ownerEmail?: string
  projectType: string
  projectDescription?: string
  location?: string
  estimatedBudget?: string
  creditsSpent: number
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="${baseStyles}">
      <div style="${containerStyles}">
        <div style="${headerStyles}">
          <h1 style="color: white; margin: 0; font-size: 24px;">Datos del cliente</h1>
        </div>
        <div style="${contentStyles}">
        <p style="font-size: 16px; color: #374151;">Hola ${data.professionalName},</p>
        <p style="font-size: 16px; color: #374151;">
          Has accedido al lead de <strong>${data.projectType}</strong>. Aquí tienes los datos de contacto:
        </p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1f2937;">Datos del cliente</h3>
          <p style="margin: 8px 0;"><strong>Nombre:</strong> ${data.ownerName}</p>
          <p style="margin: 8px 0;"><strong>Teléfono:</strong> <a href="tel:${data.ownerPhone}" style="color: #f97316;">${data.ownerPhone}</a></p>
          ${data.ownerEmail ? `<p style="margin: 8px 0;"><strong>Email:</strong> <a href="mailto:${data.ownerEmail}" style="color: #f97316;">${data.ownerEmail}</a></p>` : ""}
          ${data.location ? `<p style="margin: 8px 0;"><strong>Ubicación:</strong> ${data.location}</p>` : ""}
        </div>
        
        ${data.projectDescription
      ? `
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1f2937;">Descripción del proyecto</h3>
          <p style="color: #4b5563;">${data.projectDescription}</p>
          ${data.estimatedBudget ? `<p style="margin-top: 10px;"><strong>Presupuesto estimado:</strong> ${data.estimatedBudget}</p>` : ""}
        </div>
        `
      : ""
    }
        
        <div style="background-color: #fef3c7; border-left: 4px solid #f97316; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            <strong>Importante:</strong> Tienes 7 días para contactar al cliente. 
            Si no puedes contactar, puedes solicitar la devolución del 75% de tus créditos (${Math.floor(data.creditsSpent * 0.75)} créditos).
          </p>
        </div>
        
        <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://presupuestalo.com"}/dashboard/mis-leads" style="${buttonStyles}">
          Ver mis leads
        </a>
      </div>
      <div style="${footerStyles}">
        <p>Créditos utilizados: ${data.creditsSpent}</p>
        <p>© ${new Date().getFullYear()} Presupuéstalo. Todos los derechos reservados.</p>
      </div>
    </body>
    </html>
  `
}

// Template: Reclamación recibida
export function claimReceivedTemplate(data: {
  professionalName: string
  projectType: string
  claimReason: string
  creditsSpent: number
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="${baseStyles}">
      <div style="${containerStyles}">
        <div style="${headerStyles}">
          <h1 style="color: white; margin: 0; font-size: 24px;">Reclamación recibida</h1>
        </div>
        <div style="${contentStyles}">
        <p style="font-size: 16px; color: #374151;">Hola ${data.professionalName},</p>
        <p style="font-size: 16px; color: #374151;">
          Hemos recibido tu solicitud de devolución para el lead de <strong>${data.projectType}</strong>.
        </p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 8px 0;"><strong>Motivo:</strong> ${data.claimReason}</p>
          <p style="margin: 8px 0;"><strong>Créditos a devolver (si se aprueba):</strong> ${Math.floor(data.creditsSpent * 0.75)} créditos (75%)</p>
        </div>
        
        <p style="font-size: 14px; color: #6b7280;">
          Nuestro equipo revisará tu solicitud en las próximas 24-48 horas. 
          Te notificaremos por email cuando tengamos una resolución.
        </p>
        </div>
      </div>
      <div style="${footerStyles}">
        <p>© ${new Date().getFullYear()} Presupuéstalo. Todos los derechos reservados.</p>
      </div>
    </body>
    </html>
  `
}

// Template: Reclamación aprobada
export function claimApprovedTemplate(data: {
  professionalName: string
  projectType: string
  creditsRefunded: number
  adminNotes?: string
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="${baseStyles}">
      <div style="${containerStyles}">
        <div style="${headerStyles}">
          <h1 style="color: white; margin: 0; font-size: 24px;">Reclamación aprobada</h1>
        </div>
        <div style="${contentStyles}">
        <p style="font-size: 16px; color: #374151;">Hola ${data.professionalName},</p>
        <p style="font-size: 16px; color: #374151;">
          Tu solicitud de devolución para el lead de <strong>${data.projectType}</strong> ha sido <strong style="color: #16a34a;">aprobada</strong>.
        </p>
        
        <div style="background-color: #dcfce7; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p style="font-size: 14px; color: #166534; margin: 0;">Créditos devueltos</p>
          <p style="font-size: 32px; font-weight: bold; color: #16a34a; margin: 10px 0;">${data.creditsRefunded}</p>
        </div>
        
        ${data.adminNotes
      ? `
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #4b5563; font-size: 14px;"><strong>Nota:</strong> ${data.adminNotes}</p>
        </div>
        `
      : ""
    }
        
        <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://presupuestalo.com"}/dashboard/creditos" style="${buttonStyles}">
          Ver mi balance de créditos
        </a>
        </div>
      </div>
      <div style="${footerStyles}">
        <p>© ${new Date().getFullYear()} Presupuéstalo. Todos los derechos reservados.</p>
      </div>
    </body>
    </html>
  `
}

// Template: Reclamación rechazada
export function claimRejectedTemplate(data: {
  professionalName: string
  projectType: string
  adminNotes?: string
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="${baseStyles}">
      <div style="${containerStyles}">
        <div style="${headerStyles}">
          <h1 style="color: white; margin: 0; font-size: 24px;">Reclamación no aprobada</h1>
        </div>
        <div style="${contentStyles}">
        <p style="font-size: 16px; color: #374151;">Hola ${data.professionalName},</p>
        <p style="font-size: 16px; color: #374151;">
          Lamentamos informarte que tu solicitud de devolución para el lead de <strong>${data.projectType}</strong> 
          <strong style="color: #dc2626;">no ha sido aprobada</strong>.
        </p>
        
        ${data.adminNotes
      ? `
        <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #991b1b; font-size: 14px;"><strong>Motivo:</strong> ${data.adminNotes}</p>
        </div>
        `
      : ""
    }
        
        <p style="font-size: 14px; color: #6b7280;">
          Si crees que esta decisión es incorrecta, puedes contactar con nuestro equipo de soporte 
          respondiendo a este email.
        </p>
        </div>
      </div>
      <div style="${footerStyles}">
        <p>© ${new Date().getFullYear()} Presupuéstalo. Todos los derechos reservados.</p>
      </div>
    </body>
    </html>
  `
}

// Template: Nueva reclamación para el admin
export function newClaimAdminTemplate(data: {
  professionalName: string
  professionalEmail: string
  projectType: string
  ownerName: string
  claimReason: string
  claimDetails?: string
  creditsSpent: number
  claimRate?: number
  otherProfessionalsContacted?: number
}): string {
  const isHighRisk = (data.claimRate || 0) > 20
  const otherContacted = (data.otherProfessionalsContacted || 0) > 0

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="${baseStyles}">
      <div style="${containerStyles}">
        <div style="${headerStyles}">
          <h1 style="color: white; margin: 0; font-size: 24px;">Nueva reclamación pendiente</h1>
        </div>
        <div style="${contentStyles}">
        ${isHighRisk
      ? `
        <div style="background-color: #fef2f2; border: 2px solid #dc2626; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 0; color: #dc2626; font-weight: bold;">⚠️ ALERTA: Este profesional tiene una tasa de reclamación alta (${data.claimRate?.toFixed(1)}%)</p>
        </div>
        `
      : ""
    }
        
        ${otherContacted
      ? `
        <div style="background-color: #fef3c7; border: 2px solid #f59e0b; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 0; color: #92400e; font-weight: bold;">⚠️ ATENCIÓN: ${data.otherProfessionalsContacted} profesional(es) marcaron este lead como "contactado"</p>
        </div>
        `
      : ""
    }
        
        <h3 style="color: #1f2937;">Datos del profesional</h3>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 8px 0;"><strong>Nombre:</strong> ${data.professionalName}</p>
          <p style="margin: 8px 0;"><strong>Email:</strong> ${data.professionalEmail}</p>
          ${data.claimRate !== undefined ? `<p style="margin: 8px 0;"><strong>Tasa de reclamación:</strong> ${data.claimRate.toFixed(1)}%</p>` : ""}
        </div>
        
        <h3 style="color: #1f2937;">Datos del lead</h3>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 8px 0;"><strong>Proyecto:</strong> ${data.projectType}</p>
          <p style="margin: 8px 0;"><strong>Propietario:</strong> ${data.ownerName}</p>
          <p style="margin: 8px 0;"><strong>Créditos gastados:</strong> ${data.creditsSpent}</p>
          <p style="margin: 8px 0;"><strong>Devolución (75%):</strong> ${Math.floor(data.creditsSpent * 0.75)} créditos</p>
        </div>
        
        <h3 style="color: #1f2937;">Motivo de la reclamación</h3>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 8px 0;"><strong>Motivo:</strong> ${data.claimReason}</p>
          ${data.claimDetails ? `<p style="margin: 8px 0;"><strong>Detalles:</strong> ${data.claimDetails}</p>` : ""}
        </div>
        
        <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://presupuestalo.com"}/dashboard/admin/reclamaciones" style="${buttonStyles}">
          Revisar reclamación
        </a>
      </div>
      <div style="${footerStyles}">
        <p>© ${new Date().getFullYear()} Presupuéstalo - Panel de Administración</p>
      </div>
    </body>
    </html>
  `
}

// Template: Confirmación de compra de créditos
export function creditPurchaseConfirmationTemplate(data: {
  userName: string
  creditsAmount: number
  pricePaid: number
  newBalance: number
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="${baseStyles}">
      <div style="${containerStyles}">
        <div style="${headerStyles}">
          <h1 style="color: white; margin: 0; font-size: 24px;">¡Compra Confirmada!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Tus créditos ya están disponibles</p>
        </div>
        <div style="${contentStyles}">
        <p style="font-size: 16px; color: #374151;">Hola ${data.userName || "Usuario"},</p>
        <p style="font-size: 16px; color: #374151;">
          Tu compra de créditos se ha procesado correctamente. Aquí tienes el resumen:
        </p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Créditos comprados:</td>
              <td style="padding: 10px 0; color: #1f2937; font-weight: bold; text-align: right; font-size: 18px;">${data.creditsAmount.toLocaleString("es-ES")}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Importe pagado:</td>
              <td style="padding: 10px 0; color: #1f2937; font-weight: bold; text-align: right; font-size: 18px;">${data.pricePaid.toFixed(2)} €</td>
            </tr>
            <tr style="border-top: 2px solid #e5e7eb;">
              <td style="padding: 15px 0 10px 0; color: #6b7280; font-size: 14px;">Tu nuevo balance:</td>
              <td style="padding: 15px 0 10px 0; color: #f97316; font-weight: bold; text-align: right; font-size: 24px;">${data.newBalance.toLocaleString("es-ES")} créditos</td>
            </tr>
          </table>
        </div>
        
        <div style="text-align: center;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://presupuestalo.com"}/dashboard/solicitudes-disponibles" style="${buttonStyles}">
            Ver Leads Disponibles
          </a>
        </div>
        
        <p style="font-size: 14px; color: #6b7280; margin-top: 25px;">
          Recuerda que tus créditos no caducan. Úsalos cuando encuentres proyectos que te interesen.
        </p>
      </div>
      <div style="${footerStyles}">
        <p>Este es un email automático de <a href="https://presupuestalo.com" style="color: #f97316;">Presupuéstalo</a>.</p>
        <p>© ${new Date().getFullYear()} Presupuéstalo. Todos los derechos reservados.</p>
      </div>
    </body>
    </html>
  `
}

// Aliases para compatibilidad con las APIs de claims
export const emailClaimReceived = claimReceivedTemplate
export const emailAdminNewClaim = newClaimAdminTemplate
export function emailClaimResolved(data: {
  professionalName: string
  projectType: string
  approved: boolean
  creditsRefunded?: number
  adminNotes?: string
}): string {
  if (data.approved) {
    return claimApprovedTemplate({
      professionalName: data.professionalName,
      projectType: data.projectType,
      creditsRefunded: data.creditsRefunded || 0,
      adminNotes: data.adminNotes,
    })
  } else {
    return claimRejectedTemplate({
      professionalName: data.professionalName,
      projectType: data.projectType,
      adminNotes: data.adminNotes,
    })
  }
}
export const emailProfessionalInterested = professionalInterestedTemplate
export const emailLeadAccessConfirmation = leadAccessConfirmationTemplate

// Template: Notificación al propietario cuando publica su solicitud
export function leadPublishedHomeownerTemplate(data: {
  ownerName: string
  location: string
  estimatedBudget: string
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="${baseStyles}">
      <div style="${containerStyles}">
        <div style="${headerStyles}">
          <h1 style="color: white; margin: 0; font-size: 24px;">¡Tu solicitud ha sido publicada!</h1>
        </div>
        <div style="${contentStyles}">
          <p style="font-size: 16px; color: #374151;">Hola <strong>${data.ownerName}</strong>,</p>
          
          <p style="font-size: 16px; color: #374151; line-height: 1.6;">
            Hemos recibido tu solicitud de presupuesto y ya estamos en búsqueda de profesionales 
            que puedan ayudarte con tu reforma.
          </p>
          
          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 0; color: #92400e; font-weight: bold;">⚠️ Importante:</p>
            <p style="margin: 10px 0 0 0; color: #92400e; font-size: 14px;">
              Tus datos de contacto serán compartidos con hasta 3 profesionales verificados de tu zona. 
              <strong>Estate atento por si te llaman</strong> para ofrecerte sus servicios y presupuestos.
            </p>
          </div>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 16px;">📋 Resumen de tu solicitud:</h3>
            <p style="margin: 8px 0; color: #4b5563; font-size: 14px;"><strong>Ubicación:</strong> ${data.location}</p>
            <p style="margin: 8px 0; color: #4b5563; font-size: 14px;"><strong>Presupuesto estimado:</strong> ${data.estimatedBudget}</p>
          </div>
          
          <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
            Un saludo,<br>
            <strong>El equipo de Presupuéstalo</strong>
          </p>
        </div>
      </div>
      <div style="${footerStyles}">
        <p>© ${new Date().getFullYear()} Presupuéstalo. Todos los derechos reservados.</p>
      </div>
    </body>
    </html>
  `
}

// Template: Notificación al admin de nueva solicitud
export function leadPublishedAdminTemplate(data: {
  leadId: string
  ownerName: string
  ownerEmail: string
  ownerPhone: string
  location: string
  estimatedBudget: string
  creditsCost: number
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="${baseStyles}">
      <div style="${containerStyles}">
        <div style="${headerStyles}; background: #059669;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Nueva Solicitud de Reforma</h1>
        </div>
        <div style="${contentStyles}">
          <p style="font-size: 16px; color: #374151;">Se ha publicado una nueva solicitud en la plataforma.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 16px;">👤 Cliente:</h3>
            <p style="margin: 8px 0; color: #4b5563; font-size: 14px;"><strong>ID Lead:</strong> ${data.leadId}</p>
            <p style="margin: 8px 0; color: #4b5563; font-size: 14px;"><strong>Nombre:</strong> ${data.ownerName}</p>
            <p style="margin: 8px 0; color: #4b5563; font-size: 14px;"><strong>Email:</strong> ${data.ownerEmail}</p>
            <p style="margin: 8px 0; color: #4b5563; font-size: 14px;"><strong>Teléfono:</strong> ${data.ownerPhone}</p>
          </div>
          
          <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #059669;">
            <h3 style="color: #065f46; margin: 0 0 15px 0; font-size: 16px;">📍 Ubicación:</h3>
            <p style="margin: 8px 0; color: #065f46; font-size: 14px;">${data.location}</p>
          </div>
          
          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h3 style="color: #92400e; margin: 0 0 15px 0; font-size: 16px;">💰 Economía:</h3>
            <p style="margin: 8px 0; color: #92400e; font-size: 14px;"><strong>Presupuesto:</strong> ${data.estimatedBudget}</p>
            <p style="margin: 8px 0; color: #92400e; font-size: 14px;"><strong>Créditos (Basic):</strong> ${data.creditsCost}</p>
          </div>
        </div>
      </div>
      <div style="${footerStyles}">
        <p>Panel de Administración - Presupuéstalo</p>
      </div>
    </body>
    </html>
  `
}

// Template: Notificación de nuevo lead disponible para profesionales de la zona
export function newLeadAvailableTemplate(data: {
  professionalName: string
  projectType: string
  city: string
  province: string
  estimatedBudget: string
  creditsCost: number
  professionalPlan?: string
}): string {
  const plan = data.professionalPlan || "free"

  let upgradeMessage = ""
  if (plan === "free") {
    upgradeMessage = `
      <div style="background-color: #fff7ed; border: 1px dashed #f97316; padding: 15px; border-radius: 8px; margin-top: 20px;">
        <p style="margin: 0; color: #9a3412; font-size: 13px;">
          <strong>💡 Tip de ahorro:</strong> Estás en el plan <strong>Gratuito</strong>. 
          Si subes al plan <strong>PRO</strong>, ¡este lead te costaría solo <strong>${Math.round(data.creditsCost / 4)} créditos</strong>! (ahorras un 75%).
        </p>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://presupuestalo.com"}/dashboard/planes" style="color: #f97316; font-size: 13px; font-weight: bold; text-decoration: underline; display: block; margin-top: 8px;">
          Ver planes y ahorrar créditos →
        </a>
      </div>
    `
  } else if (plan === "basic" || plan === "starter") {
    upgradeMessage = `
      <div style="background-color: #fff7ed; border: 1px dashed #f97316; padding: 15px; border-radius: 8px; margin-top: 20px;">
        <p style="margin: 0; color: #9a3412; font-size: 13px;">
          <strong>🚀 Ahorra más:</strong> Estás en el plan <strong>Básico</strong>. 
          Sube a <strong>PRO</strong> para que los leads te cuesten la <strong>mitad de créditos</strong>.
        </p>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://presupuestalo.com"}/dashboard/planes" style="color: #f97316; font-size: 13px; font-weight: bold; text-decoration: underline; display: block; margin-top: 8px;">
          Mejorar mi plan ahora →
        </a>
      </div>
    `
  }

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="${baseStyles}">
      <div style="${containerStyles}">
        <div style="${headerStyles}">
          <h1 style="color: white; margin: 0; font-size: 24px;">¡Nuevo proyecto en tu zona!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Hay una nueva solicitud de presupuesto en ${data.province}</p>
        </div>
        <div style="${contentStyles}">
        <p style="font-size: 16px; color: #374151;">Hola ${data.professionalName},</p>
        <p style="font-size: 16px; color: #374151;">
          Se ha publicado una nueva solicitud de presupuesto que coincide con tu zona de trabajo.
        </p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1f2937;">Detalles del proyecto</h3>
          <p style="margin: 8px 0;"><strong>Tipo:</strong> ${data.projectType}</p>
          <p style="margin: 8px 0;"><strong>Ubicación:</strong> ${data.city}, ${data.province}</p>
          <p style="margin: 8px 0;"><strong>Presupuesto est.:</strong> ${data.estimatedBudget}</p>
          <p style="margin: 8px 0;"><strong>Costo:</strong> ${data.creditsCost} créditos</p>
        </div>
        
        <div style="text-align: center;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://presupuestalo.com"}/dashboard/solicitudes-disponibles" style="${buttonStyles}">
            Ver Detalles y Captar Lead
          </a>
        </div>
        
        <p style="font-size: 14px; color: #6b7280; margin-top: 25px;">
          Date prisa, solo los 3 primeros profesionales podrán acceder a los datos de contacto de este cliente.
        </p>

        ${upgradeMessage}
      </div>
    </div>
      <div style="${footerStyles}">
        <p>Este es un email automático de <a href="https://presupuestalo.com" style="color: #f97316;">Presupuéstalo</a>.</p>
        <p>© ${new Date().getFullYear()} Presupuéstalo. Todos los derechos reservados.</p>
      </div>
    </body>
    </html>
  `
}
