export const dynamic = "force-dynamic"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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

        const { url } = await request.json()
        if (!url) {
            return NextResponse.json({ error: "URL no proporcionada" }, { status: 400 })
        }

        // Identificar si la URL es de nuestro storage de Supabase
        if (!url.includes("/storage/v1/object/public/")) {
            return NextResponse.json({ success: true, message: "No es un archivo de storage público" })
        }

        try {
            // Intentar extraer bucket y path
            // Formato esperado: .../public/BUCKET_NAME/USER_ID/...
            const urlObj = new URL(url)
            const pathParts = urlObj.pathname.split("/")

            const publicIndex = pathParts.indexOf("public")
            if (publicIndex === -1 || publicIndex >= pathParts.length - 2) {
                return NextResponse.json({ error: "Formato de URL no reconocido" }, { status: 400 })
            }

            const bucketName = pathParts[publicIndex + 1]
            const filePath = pathParts.slice(publicIndex + 2).join("/")

            // Seguridad: Verificar que el archivo pertenece al usuario actual
            // El path DEBE empezar con el ID del usuario
            if (!filePath.startsWith(session.user.id)) {
                console.warn(`Intento de borrar archivo ajeno: user=${session.user.id}, file=${filePath}`)
                return NextResponse.json({ error: "No autorizado para borrar este archivo" }, { status: 403 })
            }

            console.log(`Eliminando de storage: bucket=${bucketName}, path=${filePath}`)

            const { data, error: storageError } = await supabase.storage
                .from(bucketName)
                .remove([filePath])

            if (storageError) {
                console.error("Error al borrar archivo del storage:", storageError)
                return NextResponse.json({ error: "Error al borrar archivo", details: storageError }, { status: 500 })
            }

            return NextResponse.json({ success: true, data })
        } catch (e) {
            console.error("Exception parsing URL:", e)
            return NextResponse.json({ error: "URL inválida" }, { status: 400 })
        }
    } catch (error) {
        console.error("Unexpected error:", error)
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
    }
}
