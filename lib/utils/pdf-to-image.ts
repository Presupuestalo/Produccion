import { renderPageAsImage } from "unpdf"

/**
 * Convierte la primera página de un PDF a una imagen (Buffer de PNG)
 * utilizando unpdf y @napi-rs/canvas.
 */
export async function convertPdfToImage(pdfBuffer: Buffer): Promise<Buffer> {
    try {
        console.log("[pdf-to-image] Convirtiendo PDF a imagen...")

        // renderPageAsImage devuelve un ArrayBuffer por defecto
        const imageArrayBuffer = await renderPageAsImage(pdfBuffer, 1, {
            canvasImport: () => import("@napi-rs/canvas"),
            scale: 2.0 // Mayor escala para mejor reconocimiento por parte de la IA
        })

        const buffer = Buffer.from(imageArrayBuffer)
        console.log("[pdf-to-image] Conversión completada. Tamaño de imagen:", buffer.length, "bytes")

        return buffer
    } catch (error) {
        console.error("[pdf-to-image] Error al convertir PDF a imagen:", error)
        throw error
    }
}

/**
 * Verifica si un buffer es un PDF buscando el encabezado %PDF
 */
export function isPdf(buffer: Buffer): boolean {
    if (buffer.length < 4) return false
    return buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46
}
