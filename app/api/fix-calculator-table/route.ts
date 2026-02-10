export const dynamic = "force-dynamic"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    if (!supabase) {
      return NextResponse.json({ error: "Failed to initialize Supabase client" }, { status: 500 })
    }

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
      // Verificar si la columna reform_rooms existe
      const { error: columnError } = await supabase.from("calculator_data").select("reform_rooms").limit(1)

      // Si hay un error y es porque la columna no existe, añadirla
      if (
        columnError &&
        columnError.message.includes("does not exist") &&
        columnError.message.includes("reform_rooms")
      ) {
        // Añadir la columna reform_rooms
        const alterTableSQL = `
       ALTER TABLE public.calculator_data 
       ADD COLUMN IF NOT EXISTS reform_rooms JSONB;
     `

        const { error: alterError } = await supabase.rpc("exec_sql", { sql: alterTableSQL })

        if (alterError) {
          return NextResponse.json({ error: alterError.message }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          message: "Columna reform_rooms añadida correctamente",
        })
      }

      // Verificar si la columna electrical_config existe
      const { error: electricalColumnError } = await supabase
        .from("calculator_data")
        .select("electrical_config")
        .limit(1)

      // Si hay un error y es porque la columna no existe, añadirla
      if (
        electricalColumnError &&
        electricalColumnError.message.includes("does not exist") &&
        electricalColumnError.message.includes("electrical_config")
      ) {
        // Añadir la columna electrical_config
        const alterTableSQL = `
       ALTER TABLE public.calculator_data 
       ADD COLUMN IF NOT EXISTS electrical_config JSONB;
     `

        const { error: alterError } = await supabase.rpc("exec_sql", { sql: alterTableSQL })

        if (alterError) {
          return NextResponse.json({ error: alterError.message }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          message: "Columna electrical_config añadida correctamente",
        })
      }

      return NextResponse.json({
        message: "La tabla ya existe",
        instructions: "La tabla calculator_data ya existe en la base de datos.",
      })
    }

    // Si la tabla no existe, devolver instrucciones para crearla manualmente
    return NextResponse.json(
      {
        error: "La tabla calculator_data no existe",
        needsManualCreation: true,
        instructions: `
     Para crear la tabla calculator_data, ejecuta el siguiente SQL en el Editor SQL de Supabase:

     -- Asegurarse de que la extensión uuid-ossp está habilitada
     CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

     CREATE TABLE IF NOT EXISTS public.calculator_data (
       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
       project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
       global_config JSONB,
       demolition_settings JSONB,
       rooms JSONB,
       reform_rooms JSONB,
       electrical_config JSONB,
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
   `,
      },
      { status: 404 },
    )
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error inesperado" }, { status: 500 })
  }
}

