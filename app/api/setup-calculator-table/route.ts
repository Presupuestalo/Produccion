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

    // Verificar si la tabla ya existe
    const { error: checkError } = await supabase.from("calculator_data").select("id").limit(1)

    // Si no hay error, la tabla ya existe
    if (!checkError) {
      return NextResponse.json({ message: "La tabla ya existe" })
    }

    // Crear la tabla
    const createTableSQL = `
    -- Asegurarse de que la extensión uuid-ossp está habilitada
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    CREATE TABLE IF NOT EXISTS public.calculator_data (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
      global_config JSONB,
      demolition_settings JSONB,
      rooms JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );

    -- Configurar seguridad RLS
    ALTER TABLE public.calculator_data ENABLE ROW LEVEL SECURITY;

    -- Crear política para que los usuarios solo puedan ver sus propios datos
    CREATE POLICY "Users can view their own calculator data" 
      ON public.calculator_data 
      FOR SELECT 
      USING (
        project_id IN (
          SELECT id FROM public.projects WHERE user_id = auth.uid()
        )
      );

    -- Crear política para que los usuarios solo puedan insertar sus propios datos
    CREATE POLICY "Users can insert their own calculator data" 
      ON public.calculator_data 
      FOR INSERT 
      WITH CHECK (
        project_id IN (
          SELECT id FROM public.projects WHERE user_id = auth.uid()
        )
      );

    -- Crear política para que los usuarios solo puedan actualizar sus propios datos
    CREATE POLICY "Users can update their own calculator data" 
      ON public.calculator_data 
      FOR UPDATE 
      USING (
        project_id IN (
          SELECT id FROM public.projects WHERE user_id = auth.uid()
        )
      );

    -- Crear política para que los usuarios solo puedan eliminar sus propios datos
    CREATE POLICY "Users can delete their own calculator data" 
      ON public.calculator_data 
      FOR DELETE 
      USING (
        project_id IN (
          SELECT id FROM public.projects WHERE user_id = auth.uid()
        )
      );
  `

    const { error } = await supabase.rpc("exec_sql", { sql: createTableSQL })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Tabla creada correctamente" })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error inesperado" }, { status: 500 })
  }
}
