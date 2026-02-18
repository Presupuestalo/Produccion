import jsPDF from "jspdf"
import { Room, Wall, calculateRoomStats } from "./geometry"

interface ExportOptions {
    showMeasures: boolean
    showRoomNames: boolean
    showAreas: boolean
    showSummary: boolean
    orientation: "portrait" | "landscape"
}

interface CompanyInfo {
    name?: string
    address?: string
    phone?: string
    email?: string
    cif?: string
    website?: string
    logo?: string
}

export async function generateFloorPlanPDF(
    imageDataUrl: string,
    options: ExportOptions,
    projectName: string = "Plano",
    rooms: any[] = [],
    walls: Wall[] = [],
    shunts: any[] = [],
    companyInfo?: CompanyInfo
) {
    try {
        // Preload logo if exists to get it as base64 or ensure it's loaded
        let logoData = null;
        if (companyInfo?.logo) {
            try {
                const logoImg = new Image();
                logoImg.crossOrigin = "Anonymous";
                await new Promise((resolve, reject) => {
                    logoImg.onload = resolve;
                    logoImg.onerror = reject;
                    logoImg.src = companyInfo.logo!;
                });
                logoData = logoImg;
            } catch (e) {
                console.error("Error preloading logo:", e);
            }
        }

        const doc = new jsPDF({
            orientation: options.orientation,
            unit: "mm",
            format: "a4"
        })

        const pageWidth = doc.internal.pageSize.getWidth()
        const pageHeight = doc.internal.pageSize.getHeight()

        // 1. Add Header info with Company Data
        const hasCompanyInfo = companyInfo && (companyInfo.name || companyInfo.address || companyInfo.phone || companyInfo.email || companyInfo.cif || companyInfo.website)
        let headerSpace = 10

        if (hasCompanyInfo || options.orientation === "landscape") {
            const marginX = 15
            let currentY = 15
            const logoSize = 25
            const hasLogo = !!logoData

            // Add Logo if exists
            if (hasLogo && logoData) {
                try {
                    doc.addImage(logoData, 'PNG', marginX, 10, logoSize, logoSize, undefined, 'FAST')
                } catch (e) {
                    console.error("Error adding logo to PDF:", e)
                }
            }

            const headerTextX = hasLogo ? marginX + logoSize + 5 : marginX

            // Company Name
            doc.setFontSize(14)
            doc.setFont("helvetica", "bold")
            doc.setTextColor(234, 88, 12) // orange-600
            doc.text(companyInfo?.name || "PRESUPUÉSTALO", headerTextX, currentY)
            currentY += 6

            // Company Details
            doc.setFontSize(8)
            doc.setFont("helvetica", "normal")
            doc.setTextColor(100, 116, 139) // slate-500

            if (options.orientation === "landscape") {
                const midPage = pageWidth / 2
                let leftColY = currentY
                let rightColY = currentY

                if (companyInfo?.address) {
                    doc.text(`Dirección: ${companyInfo.address}`, headerTextX, leftColY)
                    leftColY += 4
                }
                if (companyInfo?.phone) {
                    doc.text(`Tel: ${companyInfo.phone}`, headerTextX, leftColY)
                    leftColY += 4
                }

                if (companyInfo?.email) {
                    doc.text(`Email: ${companyInfo.email}`, midPage, rightColY)
                    rightColY += 4
                }
                if (companyInfo?.cif) {
                    doc.text(`CIF: ${companyInfo.cif}`, midPage, rightColY)
                    rightColY += 4
                }
                if (companyInfo?.website) {
                    doc.setTextColor(37, 99, 235) // blue-600
                    doc.text(`Web: ${companyInfo.website}`, midPage, rightColY)
                    rightColY += 4
                }
                currentY = Math.max(leftColY, rightColY, hasLogo ? 35 : 0)
            } else {
                // Portrait: Stacked info
                if (companyInfo?.address) {
                    doc.text(`Dirección: ${companyInfo.address}`, headerTextX, currentY)
                    currentY += 4
                }
                if (companyInfo?.phone) {
                    doc.text(`Tel: ${companyInfo.phone}`, headerTextX, currentY)
                    currentY += 4
                }
                if (companyInfo?.email) {
                    doc.text(`Email: ${companyInfo.email}`, headerTextX, currentY)
                    currentY += 4
                }
                if (companyInfo?.cif) {
                    doc.text(`CIF: ${companyInfo.cif}`, headerTextX, currentY)
                    currentY += 4
                }
                if (companyInfo?.website) {
                    doc.setTextColor(37, 99, 235) // blue-600
                    doc.text(`Web: ${companyInfo.website}`, headerTextX, currentY)
                    currentY += 4
                }
                currentY = Math.max(currentY, hasLogo ? 35 : 0)
            }

            // Project Name
            doc.setFontSize(12)
            doc.setFont("helvetica", "bold")
            doc.setTextColor(51, 65, 85) // slate-700
            doc.text(projectName, marginX, currentY + 5)
            headerSpace = currentY + 15
        }
        const footerSpace = 15
        const margin = 10

        const maxWidth = pageWidth - (margin * 2)
        const maxHeight = pageHeight - headerSpace - footerSpace

        // Load image to get original dimensions for aspect ratio
        const img = new Image()
        await new Promise((resolve, reject) => {
            img.onload = resolve
            img.onerror = reject
            img.src = imageDataUrl
        })

        const imgWidth = img.width
        const imgHeight = img.height
        const ratio = imgWidth / imgHeight

        let finalW = maxWidth
        let finalH = maxWidth / ratio

        if (finalH > maxHeight) {
            finalH = maxHeight
            finalW = maxHeight * ratio
        }

        // Center horizontally
        const imgX = margin + (maxWidth - finalW) / 2
        const imgY = headerSpace

        doc.addImage(imageDataUrl, "PNG", imgX, imgY, finalW, finalH, undefined, 'FAST')

        // 3. Add Simplified Footer
        doc.setFontSize(9)
        doc.setFont("helvetica", "normal")
        doc.setTextColor(148, 163, 184) // slate-400
        doc.text("presupuestalo.com", pageWidth / 2, pageHeight - 8, { align: "center" })

        // 4. Optional Summary Page
        const finalRooms = rooms.filter(r => r.area >= 1.0)
        if (options.showSummary && finalRooms.length > 0) {
            doc.addPage()

            // Header for second page
            doc.setFontSize(16)
            doc.setFont("helvetica", "bold")
            doc.setTextColor(234, 88, 12)
            doc.text("RESUMEN DE ESTANCIAS", 15, 20)

            doc.setFontSize(10)
            doc.setTextColor(100, 116, 139)
            doc.text(projectName, 15, 27)

            // Table Header
            const startY = 40
            doc.setFontSize(12)
            doc.setTextColor(51, 65, 85) // slate-700
            doc.text("Estancia", 15, startY)
            doc.text("Área", pageWidth - 70, startY, { align: "right" })
            doc.text("Perímetro", pageWidth - 15, startY, { align: "right" })

            doc.setDrawColor(226, 232, 240) // slate-200
            doc.line(15, startY + 2, pageWidth - 15, startY + 2)

            // Table Rows
            let currentY = startY + 10
            let totalArea = 0

            // SORT ROOMS ALPHABETICALLY (Numeric sensitivity for H1, H2, H10...)
            const sortedRooms = [...finalRooms].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }))

            sortedRooms.forEach((room) => {
                const stats = calculateRoomStats(room, walls, shunts)

                doc.setFont("helvetica", "normal")
                doc.setFontSize(11)
                doc.setTextColor(71, 85, 105) // slate-600
                doc.text(room.name, 15, currentY)

                const areaText = `${room.area.toFixed(2).replace('.', ',')} m²`
                doc.text(areaText, pageWidth - 70, currentY, { align: "right" })

                const perimText = `${stats.totalPerimeter.toFixed(2).replace('.', ',')} m`
                doc.text(perimText, pageWidth - 15, currentY, { align: "right" })

                totalArea += room.area

                // Thin line between rows
                doc.setDrawColor(241, 245, 249) // slate-100
                doc.line(15, currentY + 3, pageWidth - 15, currentY + 3)

                currentY += 10

                // Add page if table is too long
                if (currentY > pageHeight - 30) {
                    doc.addPage()
                    currentY = 20
                }
            })

            // Total row
            currentY += 5
            doc.setFont("helvetica", "bold")
            doc.setFontSize(12)
            doc.setTextColor(51, 65, 85)
            doc.text("SUPERFICIE TOTAL", 15, currentY)
            doc.text(`${totalArea.toFixed(2).replace('.', ',')} m²`, pageWidth - 70, currentY, { align: "right" })

            // Footer for second page
            doc.setFont("helvetica", "normal")
            doc.setFontSize(9)
            doc.setTextColor(148, 163, 184)
            doc.text("presupuestalo.com", pageWidth / 2, pageHeight - 8, { align: "center" })
        }

        // 5. Save
        doc.save(`Plano_${projectName.replace(/\s+/g, "_")}.pdf`)

        return true
    } catch (error) {
        console.error("Error generating Floor Plan PDF:", error)
        throw error
    }
}
