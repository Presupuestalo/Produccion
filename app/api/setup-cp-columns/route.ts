export const dynamic = "force-dynamic"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
    try {
        const supabase = await createClient()

        if (!supabase) {
            return NextResponse.json({ error: "Configuración de servidor incompleta" }, { status: 500 })
        }

        // Verificar si el usuario está autenticado
        const {
            data: { session },
        } = await supabase.auth.getSession()
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        // SQL para añadir las columnas de CP
        const sql = `
      DO $$
      BEGIN
        -- profiles: añadir address_postal_code
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'address_postal_code') THEN
          ALTER TABLE public.profiles ADD COLUMN address_postal_code TEXT;
          COMMENT ON COLUMN public.profiles.address_postal_code IS 'Código postal del usuario';
        END IF;

        -- projects: añadir postal_code (obra)
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'postal_code') THEN
          ALTER TABLE public.projects ADD COLUMN postal_code TEXT;
          COMMENT ON COLUMN public.projects.postal_code IS 'Código postal de la ubicación de la obra';
        END IF;

        -- projects: añadir client_postal_code (cliente)
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'client_postal_code') THEN
          ALTER TABLE public.projects ADD COLUMN client_postal_code TEXT;
          COMMENT ON COLUMN public.projects.client_postal_code IS 'Código postal de la dirección del cliente';
        END IF;
      END
      $$;
    `

        // Ejecutar el SQL usando la función RPC exec_sql
        // Nota: Esta función debe existir en Supabase. Si no existe, fallará.
        const { error } = await supabase.rpc("exec_sql", { sql })

        if (error) {
            console.error("Error al ejecutar SQL:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            message: "Columnas de código postal añadidas/verificadas correctamente. Por favor, recarga el panel de Supabase si fuera necesario."
        })
    } catch (error: any) {
        console.error("Error inesperado:", error)
        return NextResponse.json({ error: error.message || "Error inesperado" }, { status: 500 })
    }
}
