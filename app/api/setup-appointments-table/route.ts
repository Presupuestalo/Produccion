export const dynamic = "force-dynamic"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = createClient()

    // Verificar si el usuario estÃ¡ autenticado
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Crear la tabla usando SQL directo
    const createTableSQL = `
      -- Asegurarse de que la extensiÃ³n uuid-ossp estÃ¡ habilitada
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      CREATE TABLE IF NOT EXISTS public.project_appointments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        date DATE NOT NULL,
        time TIME NOT NULL,
        duration INTEGER NOT NULL,
        location TEXT,
        attendees TEXT,
        status TEXT NOT NULL,
        activity_id UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
      );

      -- Configurar seguridad RLS
      ALTER TABLE public.project_appointments ENABLE ROW LEVEL SECURITY;

      -- Crear polÃ­tica para que los usuarios solo puedan ver sus propias citas
      CREATE POLICY "Users can view their own appointments" 
        ON public.project_appointments 
        FOR SELECT 
        USING (
          user_id = auth.uid() OR
          project_id IN (
            SELECT id FROM public.projects WHERE user_id = auth.uid()
          )
        );

      -- Crear polÃ­tica para que los usuarios solo puedan insertar sus propias citas
      CREATE POLICY "Users can insert their own appointments" 
        ON public.project_appointments 
        FOR INSERT 
        WITH CHECK (
          user_id = auth.uid() AND
          project_id IN (
            SELECT id FROM public.projects WHERE user_id = auth.uid()
          )
        );

      -- Crear polÃ­tica para que los usuarios solo puedan actualizar sus propias citas
      CREATE POLICY "Users can update their own appointments" 
        ON public.project_appointments 
        FOR UPDATE 
        USING (
          user_id = auth.uid() OR
          project_id IN (
            SELECT id FROM public.projects WHERE user_id = auth.uid()
          )
        );

      -- Crear polÃ­tica para que los usuarios solo puedan eliminar sus propias citas
      CREATE POLICY "Users can delete their own appointments" 
        ON public.project_appointments 
        FOR DELETE 
        USING (
          user_id = auth.uid() OR
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
          error: "La funciÃ³n exec_sql no existe en la base de datos",
          needsManualCreation: true,
          instructions: `
          Para crear la tabla project_appointments, ejecuta el siguiente SQL en el Editor SQL de Supabase:

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

