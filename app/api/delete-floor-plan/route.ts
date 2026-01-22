export const dynamic = "force-dynamic"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { projectId, planType } = await request.json()

    if (!projectId || !planType) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 })
    }

    const supabase = createClient()

    // Verificar si el usuario está autenticado
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Verificar que el proyecto pertenece al usuario
    const { data: projectData, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("user_id", session.user.id)
      .single()

    if (projectError || !projectData) {
      return NextResponse.json({ error: "Proyecto no encontrado o no autorizado" }, { status: 403 })
    }

    // Obtener la URL de la imagen para eliminarla del storage
    const { data: planData, error: planError } = await supabase
      .from("project_floor_plans")
      .select("image_url")
      .eq("project_id", projectId)
      .eq("plan_type", planType)
      .single()

    if (planError && planError.code !== "PGRST116") {
      console.error("Error al obtener datos del plano:", planError)
      return NextResponse.json({ error: "Error al obtener datos del plano" }, { status: 500 })
    }

    // Eliminar el registro de la base de datos
    const { error: deleteError } = await supabase
      .from("project_floor_plans")
      .delete()
      .eq("project_id", projectId)
      .eq("plan_type", planType)

    if (deleteError) {
      console.error("Error al eliminar el plano:", deleteError)
      return NextResponse.json({ error: "Error al eliminar el plano" }, { status: 500 })
    }

    // Si tenemos la URL de la imagen, intentar eliminarla del storage
    if (planData && planData.image_url) {
      try {
        // Extraer la ruta del archivo del storage a partir de la URL
        const url = new URL(planData.image_url)
        const pathParts = url.pathname.split("/")

        // Encontrar el índice donde comienza el bucket (normalmente después de /storage/v1/object/public/)
        let bucketIndex = -1
        for (let i = 0; i < pathParts.length; i++) {
          if (pathParts[i] === "public") {
            bucketIndex = i + 1
            break
          }
        }

        if (bucketIndex !== -1 && bucketIndex < pathParts.length) {
          const bucketName = pathParts[bucketIndex]
          const filePath = pathParts.slice(bucketIndex + 1).join("/")

          console.log(`Intentando eliminar archivo: bucket=${bucketName}, path=${filePath}`)

          if (bucketName && filePath) {
            // Eliminar el archivo del storage
            const { data: deleteData, error: storageError } = await supabase.storage.from(bucketName).remove([filePath])

            if (storageError) {
              console.error("Error al eliminar archivo del storage:", storageError)
              // No fallamos la operación si no se puede eliminar el archivo
            } else {
              console.log("Archivo eliminado correctamente del storage:", deleteData)
            }
          }
        } else {
          // Intentar con el formato antiguo de URL
          const storagePathMatch = planData.image_url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)/)
          if (storagePathMatch) {
            const bucketName = storagePathMatch[1]
            const filePath = storagePathMatch[2].split("?")[0] // Eliminar parámetros de consulta

            console.log(`Intentando eliminar archivo (formato antiguo): bucket=${bucketName}, path=${filePath}`)

            const { data: deleteData, error: storageError } = await supabase.storage.from(bucketName).remove([filePath])

            if (storageError) {
              console.error("Error al eliminar archivo del storage (formato antiguo):", storageError)
            } else {
              console.log("Archivo eliminado correctamente del storage (formato antiguo):", deleteData)
            }
          } else {
            console.warn("No se pudo extraer la ruta del archivo del storage:", planData.image_url)
          }
        }
      } catch (error) {
        console.error("Error al procesar la URL para eliminar el archivo:", error)
        // No fallamos la operación si hay un error al procesar la URL
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error inesperado:", error)
    return NextResponse.json({ error: error.message || "Error inesperado" }, { status: 500 })
  }
}

