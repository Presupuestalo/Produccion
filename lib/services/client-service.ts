import { supabase } from "@/lib/supabase/client"
import type { Client, ClientFormData } from "@/types/client"
import { v4 as uuidv4 } from "uuid"

export async function getClients() {
  try {
    const { data: session } = await supabase.auth.getSession()
    if (!session.session) {
      throw new Error("No hay sesión activa")
    }

    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("user_id", session.session.user.id)
      .order("name", { ascending: true })

    if (error) {
      // Verificar si el error es porque la tabla no existe
      if (error.message.includes("does not exist")) {
        return null
      }
      throw error
    }

    // Si no hay clientes, intentar sincronizar automáticamente desde proyectos
    if (data.length === 0) {
      try {
        // Verificar si hay clientes en proyectos
        const { data: projects, error: projectsError } = await supabase.from("projects").select("client")

        if (!projectsError && projects && projects.length > 0) {
          // Hay proyectos con clientes, intentar sincronizar automáticamente
          const uniqueClients = [...new Set(projects.map((p) => p.client))].filter(Boolean)

          if (uniqueClients.length > 0) {
            // Hay clientes únicos en proyectos, crear registros en la tabla clients
            const newClients = uniqueClients.map((name) => ({
              id: uuidv4(),
              name,
              user_id: session.session.user.id,
              created_at: new Date().toISOString(),
            }))

            const { data: insertedClients, error: insertError } = await supabase
              .from("clients")
              .insert(newClients)
              .select()

            if (!insertError && insertedClients) {
              return insertedClients
            }
          }
        }
      } catch (syncError) {
        console.error("Error al sincronizar clientes automáticamente:", syncError)
      }
    }

    return data as Client[]
  } catch (error) {
    console.error("Error al obtener clientes:", error)
    throw error
  }
}

export async function getClientById(id: string) {
  try {
    const { data, error } = await supabase.from("clients").select("*").eq("id", id).single()

    if (error) {
      throw error
    }

    return data as Client
  } catch (error) {
    console.error(`Error al obtener el cliente con ID ${id}:`, error)
    return null
  }
}

export async function createClient(clientData: ClientFormData) {
  try {
    // Verificar si hay una sesión activa
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      console.error("Error al obtener la sesión:", sessionError)
      throw new Error("Error de autenticación: " + sessionError.message)
    }

    if (!sessionData.session) {
      throw new Error("No hay sesión activa")
    }

    // Verificar si la tabla clients existe
    try {
      const { error: tableCheckError } = await supabase.from("clients").select("id").limit(1)

      if (tableCheckError && tableCheckError.message.includes("does not exist")) {
        // La tabla no existe, intentar crearla automáticamente
        await createClientsTable()
      }
    } catch (tableCheckError) {
      // Continuamos de todos modos, ya que el error real se capturará en la inserción
    }

    // Crear el cliente
    const newClient = {
      id: uuidv4(),
      ...clientData,
      user_id: sessionData.session.user.id,
      created_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from("clients").insert(newClient).select()

    if (error) {
      throw error
    }

    return data[0] as Client
  } catch (error: any) {
    // Mejorar el mensaje de error para proporcionar más contexto
    if (error.message && error.message.includes("NetworkError")) {
      throw new Error(
        "Error de conexión con la base de datos. Verifica tu conexión a internet y las credenciales de Supabase.",
      )
    }

    throw error
  }
}

export async function updateClient(id: string, clientData: Partial<Client>) {
  try {
    const { data, error } = await supabase.from("clients").update(clientData).eq("id", id).select()

    if (error) {
      throw error
    }

    return data[0] as Client
  } catch (error) {
    console.error(`Error al actualizar el cliente con ID ${id}:`, error)
    throw error
  }
}

export async function deleteClient(id: string) {
  try {
    const { error } = await supabase.from("clients").delete().eq("id", id)

    if (error) {
      throw error
    }

    return true
  } catch (error) {
    console.error(`Error al eliminar el cliente con ID ${id}:`, error)
    throw error
  }
}

// Función para crear la tabla clients si no existe
async function createClientsTable() {
  try {
    // Usar RPC para ejecutar SQL directamente
    const createTableSQL = `
    CREATE TABLE IF NOT EXISTS public.clients (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      address TEXT,
      notes TEXT,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );

    -- Configurar seguridad RLS
    ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

    -- Crear política para que los usuarios solo puedan ver sus propios clientes
    CREATE POLICY "Users can view their own clients" 
      ON public.clients 
      FOR SELECT 
      USING (auth.uid() = user_id);

    -- Crear política para que los usuarios solo puedan insertar sus propios clientes
    CREATE POLICY "Users can insert their own clients" 
      ON public.clients 
      FOR INSERT 
      WITH CHECK (auth.uid() = user_id);

    -- Crear política para que los usuarios solo puedan actualizar sus propios clientes
    CREATE POLICY "Users can update their own clients" 
      ON public.clients 
      FOR UPDATE 
      USING (auth.uid() = user_id);

    -- Crear política para que los usuarios solo puedan eliminar sus propios clientes
    CREATE POLICY "Users can delete their own clients" 
      ON public.clients 
      FOR DELETE 
      USING (auth.uid() = user_id);
  `

    const { error } = await supabase.rpc("exec_sql", { sql: createTableSQL })

    if (error) {
      console.error("Error al crear la tabla clients:", error)
      throw error
    }

    return true
  } catch (error) {
    console.error("Error al crear la tabla clients:", error)
    throw error
  }
}
