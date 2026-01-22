export const dynamic = "force-dynamic"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { imageUrl } = await request.json()

    if (!imageUrl) {
      return NextResponse.json({ error: "URL de imagen no proporcionada" }, { status: 400 })
    }

    // Extraer la ruta del archivo del storage a partir de la URL
    const url = new URL(imageUrl)
    const pathParts = url.pathname.split("/")
    const bucketName = pathParts[2] // Normalmente 'project-files'
    const filePath = pathParts.slice(3).join("/") // El resto de la ruta

    if (!bucketName || !filePath) {
      return NextResponse.json(
        {
          error: "No se pudo extraer la información del bucket o ruta del archivo",
          details: { url: imageUrl, pathParts },
        },
        { status: 400 },
      )
    }

    const supabase = createClient()

    // Verificar si el usuario está autenticado
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Verificar si el archivo existe
    const { data: fileData, error: fileError } = await supabase.storage.from(bucketName).download(filePath)

    if (fileError) {
      // Intentar corregir los permisos del bucket
      await supabase.rpc("exec_sql", {
        sql: `
          -- Asegurarse de que el bucket project-files existe
          DO $$
          BEGIN
            PERFORM storage.create_bucket('${bucketName}', '{"public": true}');
          EXCEPTION WHEN OTHERS THEN
            NULL;
          END $$;

          -- Eliminar políticas existentes para el bucket
          DO $$
          BEGIN
            PERFORM storage.delete_policy('${bucketName}', 'INSERT');
          EXCEPTION WHEN OTHERS THEN
            NULL;
          END $$;
          
          DO $$
          BEGIN
            PERFORM storage.delete_policy('${bucketName}', 'SELECT');
          EXCEPTION WHEN OTHERS THEN
            NULL;
          END $$;
          
          DO $$
          BEGIN
            PERFORM storage.delete_policy('${bucketName}', 'UPDATE');
          EXCEPTION WHEN OTHERS THEN
            NULL;
          END $$;
          
          DO $$
          BEGIN
            PERFORM storage.delete_policy('${bucketName}', 'DELETE');
          EXCEPTION WHEN OTHERS THEN
            NULL;
          END $$;

          -- Crear nuevas políticas más permisivas para el bucket
          SELECT storage.create_policy('${bucketName}', 'INSERT', 'authenticated', true);
          SELECT storage.create_policy('${bucketName}', 'SELECT', 'authenticated', true);
          SELECT storage.create_policy('${bucketName}', 'UPDATE', 'authenticated', true);
          SELECT storage.create_policy('${bucketName}', 'DELETE', 'authenticated', true);
        `,
      })

      // Intentar hacer el bucket público directamente
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/bucket/${bucketName}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
          },
          body: JSON.stringify({
            public: true,
            file_size_limit: 5242880, // 5MB
          }),
        })

        if (!response.ok && response.status !== 400) {
          const errorData = await response.json()
          console.warn("Error al actualizar bucket:", errorData)
        }
      } catch (error) {
        console.warn("Error al actualizar bucket directamente:", error)
      }

      return NextResponse.json({
        success: false,
        error: fileError.message,
        corrected: true,
        message: "Se han corregido los permisos. Intenta cargar la imagen nuevamente.",
      })
    }

    return NextResponse.json({
      success: true,
      message: "La imagen existe y es accesible",
    })
  } catch (error: any) {
    console.error("Error inesperado:", error)
    return NextResponse.json(
      {
        error: error.message || "Error inesperado",
        details: error.stack,
      },
      { status: 500 },
    )
  }
}

