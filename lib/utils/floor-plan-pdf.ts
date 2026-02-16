import jsPDF from "jspdf"
import { Room, Wall, calculateRoomStats } from "./geometry"

interface ExportOptions {
    showMeasures: boolean
    showRoomNames: boolean
    showAreas: boolean
    showSummary: boolean
    orientation: "portrait" | "landscape"
}

export async function generateFloorPlanPDF(
    imageDataUrl: string,
    options: ExportOptions,
    projectName: string = "Plano",
    rooms: any[] = [],
    walls: Wall[] = [],
    shunts: any[] = []
) {
    try {
        const doc = new jsPDF({
            orientation: options.orientation,
            unit: "mm",
            format: "a4"
        })

        const pageWidth = doc.internal.pageSize.getWidth()
        const pageHeight = doc.internal.pageSize.getHeight()

        // 1. Add Header info (Only if NOT portrait, as per user request to avoid deform/clutter in vertical)
        if (options.orientation === "landscape") {
            doc.setFontSize(16)
            doc.setFont("helvetica", "bold")
            doc.setTextColor(234, 88, 12) // orange-600
            doc.text("PRESUPUÉSTALO", 15, 20)

            doc.setFontSize(12)
            doc.setTextColor(100, 116, 139) // slate-500
            doc.text(projectName, 15, 28)
        }

        // 2. Add the Image with ASPECT RATIO FIX
        const margin = 10
        const headerSpace = options.orientation === "landscape" ? 35 : 10
        const footerSpace = 15

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
        if (options.showSummary && rooms.length > 0) {
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
            const sortedRooms = [...rooms].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }))

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
