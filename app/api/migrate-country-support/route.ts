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

    console.log("[v0] Starting country support migration...")

    // Step 1: Add fields to profiles table
    const profilesSQL = `
      -- Add personal data and country support to profiles table
      ALTER TABLE profiles 
      ADD COLUMN IF NOT EXISTS full_name TEXT,
      ADD COLUMN IF NOT EXISTS phone TEXT,
      ADD COLUMN IF NOT EXISTS dni_nif TEXT,
      ADD COLUMN IF NOT EXISTS address_street TEXT,
      ADD COLUMN IF NOT EXISTS address_city TEXT,
      ADD COLUMN IF NOT EXISTS address_province TEXT,
      ADD COLUMN IF NOT EXISTS address_postal_code TEXT,
      ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'ES',
      ADD COLUMN IF NOT EXISTS avatar_url TEXT;

      -- Add indexes
      CREATE INDEX IF NOT EXISTS idx_profiles_country ON profiles(country);
    `

    const { error: profilesError } = await supabase.rpc("exec_sql", { sql: profilesSQL })

    if (profilesError) {
      console.error("[v0] Error migrating profiles:", profilesError)
      return NextResponse.json({ error: "Error al migrar tabla profiles: " + profilesError.message }, { status: 500 })
    }

    console.log("[v0] Profiles table migrated successfully")

    // Step 2: Add fields to projects table
    const projectsSQL = `
      -- Add country support to projects table
      ALTER TABLE projects 
      ADD COLUMN IF NOT EXISTS country_code TEXT DEFAULT 'ES',
      ADD COLUMN IF NOT EXISTS client_dni TEXT;

      -- Add index
      CREATE INDEX IF NOT EXISTS idx_projects_country ON projects(country_code);
    `

    const { error: projectsError } = await supabase.rpc("exec_sql", { sql: projectsSQL })

    if (projectsError) {
      console.error("[v0] Error migrating projects:", projectsError)
      return NextResponse.json({ error: "Error al migrar tabla projects: " + projectsError.message }, { status: 500 })
    }

    console.log("[v0] Projects table migrated successfully")

    // Step 3: Update RLS policies for profiles
    const rlsSQL = `
      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
      DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

      -- Create updated policies
      CREATE POLICY "Users can view own profile" 
      ON profiles 
      FOR SELECT 
      USING (auth.uid() = id);

      CREATE POLICY "Users can update own profile" 
      ON profiles 
      FOR UPDATE 
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
    `

    const { error: rlsError } = await supabase.rpc("exec_sql", { sql: rlsSQL })

    if (rlsError) {
      console.error("[v0] Error updating RLS policies:", rlsError)
      return NextResponse.json({ error: "Error al actualizar políticas RLS: " + rlsError.message }, { status: 500 })
    }

    console.log("[v0] RLS policies updated successfully")

    return NextResponse.json({ 
      success: true, 
      message: "Migración completada correctamente",
      details: {
        profiles: "Campos añadidos: full_name, phone, dni_nif, address_*, country, avatar_url",
        projects: "Campos añadidos: country_code, client_dni",
        rls: "Políticas RLS actualizadas"
      }
    })
  } catch (error: any) {
    console.error("[v0] Unexpected error during migration:", error)
    return NextResponse.json({ error: error.message || "Error inesperado" }, { status: 500 })
  }
}
