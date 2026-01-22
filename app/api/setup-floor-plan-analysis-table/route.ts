export const dynamic = "force-dynamic"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = createClient()

    // Verificar si el usuario está autenticado
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Crear la tabla usando SQL directo
    const createTableSQL = `
      -- Asegurarse de que la extensión uuid-ossp está habilitada
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      CREATE TABLE IF NOT EXISTS public.floor_plan_analysis (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
        plan_type TEXT NOT NULL,
        analysis_data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        UNIQUE(project_id, plan_type)
      );

      -- Configurar seguridad RLS
      ALTER TABLE public.floor_plan_analysis ENABLE ROW LEVEL SECURITY;

      -- Crear política para que los usuarios solo puedan ver sus propios análisis
      CREATE POLICY "Users can view their own floor plan analysis" 
        ON public.floor_plan_analysis 
        FOR SELECT 
        USING (
          project_id IN (
            SELECT id FROM public.projects WHERE user_id = auth.uid()
          )
        );

      -- Crear política para que los usuarios solo puedan insertar sus propios análisis
      CREATE POLICY "Users can insert their own floor plan analysis" 
        ON public.floor_plan_analysis 
        FOR INSERT 
        WITH CHECK (
          project_id IN (
            SELECT id FROM public.projects WHERE user_id = auth.uid()
          )
        );

      -- Crear política para que los usuarios solo puedan actualizar sus propios análisis
      CREATE POLICY "Users can update their own floor plan analysis" 
        ON public.floor_plan_analysis 
        FOR UPDATE 
        USING (
          project_id IN (
            SELECT id FROM public.projects WHERE user_id = auth.uid()
          )
        );

      -- Crear política para que los usuarios solo puedan eliminar sus propios análisis
      CREATE POLICY "Users can delete their own floor plan analysis" 
        ON public.floor_plan_analysis 
        FOR DELETE 
        USING (
          project_id IN (
            SELECT id FROM public.projects WHERE user_id = auth.uid()
          )
        );
    `

    // Ejecutar el SQL directamente
    const { error } = await supabase.rpc("exec_sql", { sql: createTableSQL })

    // Si hay un error con exec_sql, proporcionar instrucciones para crear la tabla manualmente
    if (error && error.message.includes("Could not find the function")) {
      return NextResponse.json(
        {
          error: "La función exec_sql no existe en la base de datos",
          needsManualCreation: true,
          instructions: `
          Para crear la tabla floor_plan_analysis, ejecuta el siguiente SQL en el Editor SQL de Supabase:

          ${createTableSQL}
        `,
        },
        { status: 404 },
      )
    }

    if (error) {
      console.error("Error al crear la tabla:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Tabla creada correctamente" })
  } catch (error: any) {
    console.error("Error inesperado:", error)
    return NextResponse.json({ error: error.message || "Error inesperado" }, { status: 500 })
  }
}

