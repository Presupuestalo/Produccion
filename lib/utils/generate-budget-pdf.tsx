interface TradeItem {
  trade_name: string
  supplier_name?: string
  final_budget: number
}

interface BudgetPDFData {
  project: {
    name: string
    client_name: string
    client_email?: string
    client_phone?: string
    address?: string
    city?: string
    province?: string
    description?: string
    created_at: string
  }
  coordinator: {
    name: string
    company_name?: string
    phone?: string
    email?: string
    cif?: string
    address?: string
  }
  trades: TradeItem[]
  totals: {
    subtotal: number
    coordination_fee: number
    coordination_fee_label: string
    total: number
  }
}

export function generateBudgetHTML(data: BudgetPDFData): string {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  }

  const tradesRows = data.trades
    .map(
      (trade, index) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${index + 1}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          <strong>${trade.trade_name}</strong>
          ${trade.supplier_name ? `<br><span style="color: #6b7280; font-size: 13px;">${trade.supplier_name}</span>` : ""}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 500;">
          ${formatCurrency(trade.final_budget)}
        </td>
      </tr>
    `,
    )
    .join("")

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Presupuesto - ${data.project.name}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #1a1a1a;
      line-height: 1.5;
      background: white;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #F47B20;
    }
    .logo-section {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .logo-icon {
      width: 50px;
      height: 54px;
    }
    .company-name {
      font-size: 24px;
      font-weight: 700;
      color: #1a1a1a;
    }
    .document-info {
      text-align: right;
    }
    .document-title {
      font-size: 28px;
      font-weight: 700;
      color: #F47B20;
      margin-bottom: 4px;
    }
    .document-date {
      color: #6b7280;
      font-size: 14px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-bottom: 40px;
    }
    .info-box {
      background: #f9fafb;
      border-radius: 8px;
      padding: 20px;
    }
    .info-box-title {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #6b7280;
      margin-bottom: 12px;
    }
    .info-box-content {
      font-size: 15px;
    }
    .info-box-content strong {
      display: block;
      font-size: 16px;
      margin-bottom: 4px;
    }
    .info-box-content p {
      margin: 2px 0;
      color: #4b5563;
    }
    .project-section {
      margin-bottom: 30px;
    }
    .section-title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 12px;
      color: #1a1a1a;
    }
    .project-description {
      background: #fefce8;
      border-left: 4px solid #F47B20;
      padding: 16px;
      border-radius: 0 8px 8px 0;
      color: #4b5563;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    thead th {
      background: #1a1a1a;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      font-size: 14px;
    }
    thead th:last-child {
      text-align: right;
    }
    tbody tr:nth-child(even) {
      background: #f9fafb;
    }
    .totals-section {
      margin-left: auto;
      width: 320px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .total-row.final {
      border-bottom: none;
      border-top: 2px solid #1a1a1a;
      padding-top: 16px;
      margin-top: 8px;
    }
    .total-row.final .total-label,
    .total-row.final .total-value {
      font-size: 20px;
      font-weight: 700;
    }
    .total-row.final .total-value {
      color: #F47B20;
    }
    .footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
    }
    .validity {
      background: #f0fdf4;
      border: 1px solid #86efac;
      border-radius: 8px;
      padding: 16px;
      margin-top: 30px;
      text-align: center;
    }
    .validity strong {
      color: #166534;
    }
    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
      .container {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-section">
        <svg class="logo-icon" viewBox="0 0 70 75" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="0" y="0" width="70" height="45" fill="#F47B20" />
          <rect x="0" y="45" width="35" height="30" fill="#ee580c" />
        </svg>
        <div>
          <div class="company-name">${data.coordinator.company_name || data.coordinator.name}</div>
          ${data.coordinator.cif ? `<div style="color: #6b7280; font-size: 13px;">CIF: ${data.coordinator.cif}</div>` : ""}
        </div>
      </div>
      <div class="document-info">
        <div class="document-title">PRESUPUESTO</div>
        <div class="document-date">${formatDate(data.project.created_at)}</div>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-box">
        <div class="info-box-title">Cliente</div>
        <div class="info-box-content">
          <strong>${data.project.client_name}</strong>
          ${data.project.client_email ? `<p>${data.project.client_email}</p>` : ""}
          ${data.project.client_phone ? `<p>${data.project.client_phone}</p>` : ""}
        </div>
      </div>
      <div class="info-box">
        <div class="info-box-title">Ubicación de la obra</div>
        <div class="info-box-content">
          <strong>${data.project.name}</strong>
          ${data.project.address ? `<p>${data.project.address}</p>` : ""}
          ${data.project.city || data.project.province ? `<p>${data.project.city || ""}${data.project.city && data.project.province ? ", " : ""}${data.project.province || ""}</p>` : ""}
        </div>
      </div>
    </div>

    ${
      data.project.description
        ? `
    <div class="project-section">
      <div class="section-title">Descripción del proyecto</div>
      <div class="project-description">${data.project.description}</div>
    </div>
    `
        : ""
    }

    <div class="section-title">Desglose de trabajos</div>
    <table>
      <thead>
        <tr>
          <th style="width: 50px;">#</th>
          <th>Concepto</th>
          <th style="width: 150px;">Importe</th>
        </tr>
      </thead>
      <tbody>
        ${tradesRows}
      </tbody>
    </table>

    <div class="totals-section">
      <div class="total-row">
        <span class="total-label">Subtotal trabajos</span>
        <span class="total-value">${formatCurrency(data.totals.subtotal)}</span>
      </div>
      ${
        data.totals.coordination_fee > 0
          ? `
      <div class="total-row">
        <span class="total-label">${data.totals.coordination_fee_label}</span>
        <span class="total-value">${formatCurrency(data.totals.coordination_fee)}</span>
      </div>
      `
          : ""
      }
      <div class="total-row final">
        <span class="total-label">TOTAL</span>
        <span class="total-value">${formatCurrency(data.totals.total)}</span>
      </div>
    </div>

    <div class="validity">
      <strong>Validez del presupuesto:</strong> 30 días desde la fecha de emisión
    </div>

    <div class="footer">
      <p>Presupuesto generado con Presupuéstalo</p>
      ${data.coordinator.phone ? `<p>Contacto: ${data.coordinator.phone}${data.coordinator.email ? ` | ${data.coordinator.email}` : ""}</p>` : ""}
    </div>
  </div>
</body>
</html>
  `
}
