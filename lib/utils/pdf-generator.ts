import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import type { BudgetWithLineItems } from "@/lib/types/budget"
import type { BudgetSettings } from "@/lib/types/budget-settings"
import { formatCurrency } from "./format"

interface ProjectData {
  title: string
  client?: string
  project_address?: string
}

interface CompanyData {
  company_name: string
  company_address?: string
  company_tax_id?: string
  company_phone?: string
  company_email?: string
  company_website?: string
  company_logo_url?: string
}

export async function generateBudgetPDF(
  budget: BudgetWithLineItems,
  settings: BudgetSettings | null,
  project: ProjectData | null,
  companyData: CompanyData | null,
  hidePrices = false,
  showWatermark = false,
) {
  try {
    console.log("[v0] generateBudgetPDF started")
    console.log("[v0] Budget line items count:", budget.line_items?.length || 0)
    console.log("[v0] Settings:", settings ? "present" : "null")
    console.log("[v0] Project:", project ? "present" : "null")
    console.log("[v0] Company data:", companyData ? "present" : "null")
    console.log("[v0] Hide prices:", hidePrices)

    const doc = new jsPDF()
    console.log("[v0] jsPDF document created")
    let yPosition = 10

    // Configuración de colores
    const primaryColor: [number, number, number] = [234, 88, 12] // orange-600
    const textColor: [number, number, number] = [0, 0, 0]
    const grayColor: [number, number, number] = [107, 114, 128]

    const addFooter = () => {
      const pageCount = (doc as any).internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(7)
        doc.setFont("helvetica", "normal")
        doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
        doc.text("presupuestalo.com", 195, 287, { align: "right" })
      }
    }

    const drawWatermark = () => {
      if (!showWatermark) return
      const pageWidth = doc.internal.pageSize.getWidth()

      // Guardar estado actual
      const originalColor = doc.getTextColor()

      // Estilo Ribbon de Esquina (Modern SaaS)
      // Color gris muy suave pero definido
      doc.setTextColor(230, 230, 230)
      doc.setFont("helvetica", "bold")
      doc.setFontSize(10)

      // Texto en la esquina superior derecha cruzado diagonalmente
      const text = "PRESUPUESTALO.COM"
      const subtext = "PLAN GRATUITO"

      // Dibujamos el texto rotado en la esquina superior derecha
      doc.setFontSize(11)
      doc.text(text, pageWidth - 35, 22, {
        angle: 45,
        align: "center"
      })

      doc.setFontSize(8)
      doc.text(subtext, pageWidth - 28, 28, {
        angle: 45,
        align: "center"
      })

      // Refuerzo central ultra-sutil (tipo contorno)
      // Solo el nombre de la web en el fondo de forma muy suave
      doc.setFontSize(60)
      doc.setTextColor(248, 248, 248)
      doc.text("PRESUPUÉSTALO", pageWidth / 2, 150, {
        align: "center",
        angle: 45
      })

      // Restaurar color
      doc.setTextColor(originalColor)
    }

    // Dibujar en la primera página
    drawWatermark()

    // Suscribirse a la creación de nuevas páginas para que siempre esté "detrás"
    const originalAddPage = doc.addPage.bind(doc)
    doc.addPage = (...args: any[]) => {
      const result = originalAddPage(...args)
      drawWatermark()
      return result
    }

    // 1. CABECERA: Logo izquierda, datos empresa derecha
    if (companyData) {
      console.log("[v0] Processing company data...")
      const logoWidth = 35
      const logoHeight = 35
      const rightColumnX = 120

      // Logo (izquierda, en la esquina superior)
      if (companyData.company_logo_url) {
        console.log("[v0] Loading company logo from:", companyData.company_logo_url)
        try {
          // Cargar la imagen como base64 para asegurar que funcione en el PDF
          const response = await fetch(companyData.company_logo_url)
          const blob = await response.blob()
          const reader = new FileReader()

          await new Promise((resolve, reject) => {
            reader.onloadend = () => {
              try {
                const base64data = reader.result as string
                doc.addImage(base64data, "PNG", 15, yPosition, logoWidth, logoHeight)
                console.log("[v0] Logo added successfully")
                resolve(true)
              } catch (err) {
                console.error("[v0] Error añadiendo logo al PDF:", err)
                resolve(false)
              }
            }
            reader.onerror = reject
            reader.readAsDataURL(blob)
          })
        } catch (err) {
          console.error("[v0] Error cargando logo:", err)
        }
      }

      // Datos de la empresa (derecha, alineados a la izquierda)
      let rightY = yPosition + 15
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(textColor[0], textColor[1], textColor[2])
      doc.text(companyData.company_name || "Mi Empresa", rightColumnX, rightY)
      rightY += 6

      doc.setFontSize(9)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(...grayColor)

      if (companyData.company_tax_id) {
        doc.text(`CIF/NIF: ${companyData.company_tax_id}`, rightColumnX, rightY)
        rightY += 4
      }

      if (companyData.company_address) {
        doc.text(String(companyData.company_address), rightColumnX, rightY)
        rightY += 4
      }

      if (companyData.company_phone) {
        doc.text(`Tel: ${companyData.company_phone}`, rightColumnX, rightY)
        rightY += 4
      }

      if (companyData.company_email) {
        doc.text(String(companyData.company_email), rightColumnX, rightY)
        rightY += 4
      }

      if (companyData.company_website) {
        doc.text(String(companyData.company_website), rightColumnX, rightY)
        rightY += 4
      }

      // Avanzar yPosition al final del logo o datos (lo que sea más largo)
      yPosition = Math.max(yPosition + logoHeight, rightY) + 8
      console.log("[v0] Company data processed, yPosition:", yPosition)
    }

    if (project) {
      console.log("[v0] Processing project data...")
      doc.setFontSize(10)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(textColor[0], textColor[1], textColor[2])
      doc.text("A la atención de:", 15, yPosition)
      yPosition += 5

      doc.setFont("helvetica", "normal")
      doc.setTextColor(...grayColor)
      if (project.client) {
        doc.text(String(project.client), 15, yPosition)
        yPosition += 5
      }

      if (project.project_address) {
        doc.setFont("helvetica", "bold")
        doc.setTextColor(textColor[0], textColor[1], textColor[2])
        doc.text("Dirección de la obra:", 15, yPosition)
        yPosition += 5

        doc.setFont("helvetica", "normal")
        doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
        doc.text(String(project.project_address), 15, yPosition)
        yPosition += 5
      }

      yPosition += 5
      console.log("[v0] Project data processed, yPosition:", yPosition)
    }

    // 3. TEXTO DE PRESENTACIÓN
    console.log("[DEBUG PDF] Checking introduction text:", settings?.introduction_text)
    if (settings?.introduction_text) {
      console.log("[v0] Adding introduction text...")
      doc.setFontSize(9)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(...grayColor)

      const lines = doc.splitTextToSize(settings.introduction_text, 180)
      doc.text(lines, 15, yPosition)
      yPosition += lines.length * 4 + 8
      console.log("[v0] Introduction text added, yPosition:", yPosition)
    } else {
      console.log("[DEBUG PDF] No introduction text found")
    }

    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.text(`Versión: ${budget.name}`, 15, yPosition)
    yPosition += 8
    console.log("[v0] Budget name added, yPosition:", yPosition)

    // 5. PARTIDAS DEL PRESUPUESTO
    // Agrupar por categoría
    console.log("[v0] Processing line items...")

    const regularItems = budget.line_items.filter((item) => !item.concept_code?.startsWith("PROP-"))
    const ownerItems = budget.line_items.filter((item) => item.concept_code?.startsWith("PROP-"))

    console.log("[v0] Regular items:", regularItems.length)
    console.log("[v0] Owner custom items:", ownerItems.length)

    const categoryMap = new Map<string, any[]>()
    const categoryTotals = new Map<string, number>()

    // Solo procesar partidas regulares en la agrupación por categoría
    regularItems.forEach((item) => {
      if (!categoryMap.has(item.category)) {
        categoryMap.set(item.category, [])
        categoryTotals.set(item.category, 0)
      }
      categoryMap.get(item.category)!.push(item)
      categoryTotals.set(item.category, categoryTotals.get(item.category)! + item.total_price)
    })

    console.log("[v0] Categories found:", categoryMap.size)
    console.log("[v0] Categories:", Array.from(categoryMap.keys()))

    categoryMap.forEach((items, category) => {
      items.sort((a, b) => {
        const codeA = a.concept_code || ""
        const codeB = b.concept_code || ""
        return codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: "base" })
      })
    })

    console.log("[v0] Generating tables...")
    // Generar tabla para cada categoría (solo partidas regulares)
    categoryMap.forEach((items, category) => {
      console.log("[v0] Processing category:", category, "with", items.length, "items")
      // Verificar si necesitamos una nueva página
      if (yPosition > 250) {
        doc.addPage()
        yPosition = 20
      }

      // Título de categoría
      doc.setFontSize(11)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(textColor[0], textColor[1], textColor[2])
      doc.text(String(category || "Sin categoría"), 15, yPosition)
      yPosition += 4

      const tableData = items.map((item) => {
        let fullDescription = item.description

        const productDetails: string[] = []
        if (item.color) productDetails.push(`Color: ${item.color}`)
        if (item.brand) productDetails.push(`Marca: ${item.brand}`)
        if (item.model) productDetails.push(`Modelo: ${item.model}`)

        if (productDetails.length > 0) {
          fullDescription += `\n${productDetails.join(" • ")}`
        }

        const baseData = [
          item.concept, // Concepto (subcategory)
          fullDescription, // Descripción completa con características
          item.unit, // Unidad
          item.quantity.toString(), // Cantidad
        ]

        if (!hidePrices) {
          baseData.push(formatCurrency(item.unit_price))
          baseData.push(formatCurrency(item.total_price))
        }

        return baseData
      })

      const tableHead = hidePrices
        ? [["Concepto", "Descripción", "Ud", "Cant."]]
        : [["Concepto", "Descripción", "Ud", "Cant.", "P. Unit.", "Total"]]

      autoTable(doc, {
        startY: yPosition,
        head: tableHead,
        body: tableData,
        theme: "striped",
        showHead: "firstPage",
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: "bold",
        },
        bodyStyles: {
          fontSize: 7,
          textColor: textColor,
        },
        columnStyles: hidePrices
          ? {
            0: { cellWidth: 45 }, // Concepto
            1: { cellWidth: 95 }, // Descripción (más ancho para color, marca, modelo)
            2: { cellWidth: 12 }, // Unidad
            3: { cellWidth: 23 }, // Cantidad
          }
          : {
            0: { cellWidth: 40 }, // Concepto
            1: { cellWidth: 75 }, // Descripción (más ancho para color, marca, modelo)
            2: { cellWidth: 12 }, // Unidad
            3: { cellWidth: 13 }, // Cantidad (reducido)
            4: { cellWidth: 22 }, // Precio Unit. (más a la derecha)
            5: { cellWidth: 28 }, // Total (más a la derecha)
          },
        margin: { left: 15, right: 15 },
      })

      yPosition = (doc as any).lastAutoTable.finalY + 2

      if (!hidePrices) {
        doc.setFillColor(245, 245, 245) // Light gray background
        doc.rect(15, yPosition, 180, 8, "F")

        doc.setFontSize(9)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(textColor[0], textColor[1], textColor[2])
        doc.text(`Total ${category}`, 20, yPosition + 5.5)
        doc.text(formatCurrency(categoryTotals.get(category)!), 190, yPosition + 5.5, { align: "right" })
      }

      yPosition += 12
    })

    console.log("[v0] All regular tables generated, yPosition:", yPosition)

    if (ownerItems.length > 0) {
      console.log("[v0] Adding owner custom items section...")

      if (yPosition > 240) {
        doc.addPage()
        yPosition = 20
      }

      // Título de partidas sin definir
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(234, 88, 12) // orange-600
      doc.text("PARTIDAS SIN DEFINIR", 15, yPosition)
      yPosition += 3

      doc.setFontSize(9)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(107, 114, 128) // gray-500
      doc.text("Partidas añadidas por el propietario que requieren cotización del profesional", 15, yPosition)
      yPosition += 6

      const ownerTableData = ownerItems.map((item) => {
        let fullDescription = item.description

        const productDetails: string[] = []
        if (item.color) productDetails.push(`Color: ${item.color}`)
        if (item.brand) productDetails.push(`Marca: ${item.brand}`)
        if (item.model) productDetails.push(`Modelo: ${item.model}`)

        if (productDetails.length > 0) {
          fullDescription += `\n${productDetails.join(" • ")}`
        }

        return [
          item.concept, // Concepto
          fullDescription, // Descripción completa
          item.unit, // Unidad
          item.quantity.toString(), // Cantidad
        ]
      })

      const ownerTableHead = [["Concepto", "Descripción", "Ud", "Cant."]]

      autoTable(doc, {
        startY: yPosition,
        head: ownerTableHead,
        body: ownerTableData,
        theme: "striped",
        headStyles: {
          fillColor: [251, 146, 60], // orange-400 (más claro para diferenciar)
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: "bold",
        },
        bodyStyles: {
          fontSize: 7,
          textColor: textColor,
          fillColor: [255, 247, 237], // orange-50 (fondo claro)
        },
        columnStyles: {
          0: { cellWidth: 45 }, // Concepto
          1: { cellWidth: 95 }, // Descripción
          2: { cellWidth: 12 }, // Unidad
          3: { cellWidth: 23 }, // Cantidad
        },
        margin: { left: 15, right: 15 },
      })

      yPosition = (doc as any).lastAutoTable.finalY + 8
      console.log("[v0] Owner items section added, yPosition:", yPosition)
    }

    const adjustments = settings?.adjustments || []
    const adjustmentsTotal = adjustments.reduce(
      (sum: number, mod: any) => sum + (mod.type === "addition" ? mod.total_price : -mod.total_price),
      0,
    )

    if (adjustments.length > 0 && !hidePrices) {
      if (yPosition > 240) {
        doc.addPage()
        yPosition = 20
      }

      // Título de modificaciones
      doc.setFontSize(11)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
      doc.text("MODIFICACIONES DEL PRESUPUESTO ORIGINAL", 15, yPosition)
      yPosition += 4

      // Tabla de modificaciones
      const modificationsData = adjustments.map((mod: any) => [
        mod.description,
        mod.unit,
        mod.quantity.toString(),
        formatCurrency(mod.unit_price),
        formatCurrency(mod.total_price),
        mod.notes || "",
      ])

      autoTable(doc, {
        startY: yPosition,
        head: [["Descripción", "Ud", "Cant.", "P. Unit.", "Total", "Notas"]],
        body: modificationsData,
        theme: "striped",
        headStyles: {
          fillColor: [249, 115, 22], // orange-500
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: "bold",
        },
        bodyStyles: {
          fontSize: 7,
          textColor: textColor,
        },
        columnStyles: {
          0: { cellWidth: 50 }, // Descripción
          1: { cellWidth: 10 }, // Unidad
          2: { cellWidth: 13 }, // Cantidad
          3: { cellWidth: 25 }, // Precio Unit.
          4: { cellWidth: 28 }, // Total
          5: { cellWidth: 54 }, // Notas
        },
        margin: { left: 15, right: 15 },
      })

      yPosition = (doc as any).lastAutoTable.finalY + 6
    }

    if (yPosition > 240) {
      doc.addPage()
      yPosition = 20
    }

    if (!hidePrices) {
      const showVat = settings?.show_vat ?? false
      const vatPercentage = settings?.vat_percentage ?? 21
      const subtotalWithAdjustments = budget.subtotal + adjustmentsTotal

      doc.setFontSize(11)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
      doc.text("RESUMEN POR CATEGORÍAS:", 15, yPosition)
      yPosition += 6

      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(textColor[0], textColor[1], textColor[2])

      const summaryX = 20
      const summaryValueX = 100

      categoryMap.forEach((items, category) => {
        doc.text(`${category}:`, summaryX, yPosition)
        doc.text(formatCurrency(categoryTotals.get(category)!), summaryValueX, yPosition, { align: "right" })
        yPosition += 5
      })

      yPosition += 8

      // Final totals section
      doc.setFontSize(11)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(textColor[0], textColor[1], textColor[2])

      const totalsX = 130
      const totalsValueX = 195

      doc.text("Presupuesto Original:", totalsX, yPosition)
      doc.text(formatCurrency(budget.subtotal), totalsValueX, yPosition, { align: "right" })
      yPosition += 6

      if (adjustmentsTotal !== 0) {
        doc.text("Ajustes y Adicionales:", totalsX, yPosition)
        if (adjustmentsTotal >= 0) {
          doc.setTextColor(22, 163, 74) // green-600
        } else {
          doc.setTextColor(220, 38, 38) // red-600
        }
        doc.text(
          `${adjustmentsTotal >= 0 ? "+" : ""}${formatCurrency(adjustmentsTotal)}`,
          totalsValueX,
          yPosition,
          {
            align: "right",
          },
        )
        doc.setTextColor(textColor[0], textColor[1], textColor[2])
        yPosition += 8
      }

      if (showVat) {
        // Mostrar subtotal, IVA y total
        doc.text("Subtotal:", totalsX, yPosition)
        doc.text(formatCurrency(subtotalWithAdjustments), totalsValueX, yPosition, { align: "right" })
        yPosition += 6

        doc.text(`IVA (${vatPercentage}%):`, totalsX, yPosition)
        const vatAmount = subtotalWithAdjustments * (vatPercentage / 100)
        doc.text(formatCurrency(vatAmount), totalsValueX, yPosition, { align: "right" })
        yPosition += 8

        doc.setFontSize(14)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
        doc.text("TOTAL:", totalsX, yPosition)
        const totalWithVat = subtotalWithAdjustments + vatAmount
        doc.text(formatCurrency(totalWithVat), totalsValueX, yPosition, { align: "right" })
      } else {
        // Mostrar solo el total sin IVA
        doc.setFontSize(14)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
        doc.text("TOTAL:", totalsX, yPosition)
        doc.text(formatCurrency(subtotalWithAdjustments), totalsValueX, yPosition, { align: "right" })
      }
    } else {
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(...grayColor)
      doc.text("Este documento muestra la relación de trabajos necesarios para tu proyecto.", 15, yPosition)
      yPosition += 5
      doc.text("Un profesional te proporcionará un presupuesto detallado con precios.", 15, yPosition)
      yPosition += 10
    }

    yPosition += 10

    // 7. NOTAS ACLARATORIAS
    console.log("[DEBUG PDF] Checking additional notes:", settings?.additional_notes)
    if (settings?.additional_notes) {
      if (yPosition > 240) {
        doc.addPage()
        yPosition = 20
      }

      console.log("[v0] Adding additional notes...")
      doc.setFontSize(11)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(textColor[0], textColor[1], textColor[2])
      doc.text("Consideraciones Adicionales:", 15, yPosition)
      yPosition += 6

      doc.setFontSize(9)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(...grayColor)

      const notesLines = doc.splitTextToSize(settings.additional_notes, 180)
      doc.text(notesLines, 15, yPosition)
      console.log("[v0] Additional notes added")
    } else {
      console.log("[DEBUG PDF] No additional notes found")
    }

    addFooter()
    console.log("[v0] Footer added")

    console.log("[v0] Saving PDF...")
    // Guardar el PDF
    doc.save(`Presupuesto_${budget.name.replace(/\s+/g, "_")}.pdf`)
    console.log("[v0] PDF saved successfully!")
  } catch (error) {
    console.error("[v0] Error generating PDF:", error)
    console.error("[v0] Error stack:", error instanceof Error ? error.stack : "No stack trace")
    throw error
  }
}
