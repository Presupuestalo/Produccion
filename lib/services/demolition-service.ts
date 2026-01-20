import { getSupabase } from "@/lib/supabase/client"
import type { DemolitionSettings } from "@/types/calculator"

// Valores predeterminados para los ajustes de demolición
const defaultDemolitionSettings: DemolitionSettings = {
  wallThickness: 10, // 10 cm
  floorTileThickness: 0.02, // 2 cm
  wallTileThickness: 0.015, // 1.5 cm
  woodExpansionCoef: 1.4,
  woodenFloorThickness: 0.018, // 1.8 cm - grosor típico de tarima/parquet
  woodenFloorExpansionCoef: 1.35, // coeficiente específico para suelo de madera
  ceramicExpansionCoef: 1.4,
  containerSize: 5, // 5 m³
}

/**
 * Verifica si la tabla demolition_settings existe y la crea si no existe
 */
export async function ensureDemolitionSettingsTableExists(): Promise<boolean> {
  try {
    const supabase = await getSupabase()
    if (!supabase) {
      console.error("Supabase client no disponible")
      return false
    }

    const { error } = await supabase.from("demolition_settings").select("id").limit(1)

    if (!error) {
      return true
    }

    if (!error.message.includes("does not exist")) {
      console.error("Error al verificar la tabla demolition_settings:", error)
      return false
    }

    const response = await fetch("/api/setup-demolition-settings-table", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const data = await response.json()
      console.error("Error al crear la tabla demolition_settings:", data.error || response.statusText)
      return false
    }

    return true
  } catch (error) {
    console.error("Error inesperado al verificar/crear la tabla demolition_settings:", error)
    return false
  }
}

/**
 * Guarda los ajustes de demolición para un proyecto específico
 */
export async function saveProjectDemolitionSettings(projectId: string, settings: DemolitionSettings): Promise<boolean> {
  try {
    const tableExists = await ensureDemolitionSettingsTableExists()
    if (!tableExists) {
      return false
    }

    const supabase = await getSupabase()
    if (!supabase) {
      console.error("Supabase client no disponible")
      return false
    }

    const { data: existingData, error: checkError } = await supabase
      .from("demolition_settings")
      .select("id")
      .eq("project_id", projectId)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error al verificar ajustes existentes:", checkError)
      throw checkError
    }

    let result
    if (existingData) {
      result = await supabase
        .from("demolition_settings")
        .update({
          settings: settings,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingData.id)
    } else {
      result = await supabase.from("demolition_settings").insert({
        project_id: projectId,
        settings: settings,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    }

    if (result.error) {
      throw result.error
    }

    return true
  } catch (error) {
    console.error("Error al guardar ajustes de demolición:", error)
    return false
  }
}

/**
 * Obtiene los ajustes de demolición para un proyecto específico
 */
export async function getProjectDemolitionSettings(projectId: string): Promise<DemolitionSettings | null> {
  try {
    try {
      const tableExists = await ensureDemolitionSettingsTableExists()
      if (!tableExists) {
        console.log("Usando ajustes de demolición predeterminados porque la tabla no existe")
        return defaultDemolitionSettings
      }
    } catch (tableError) {
      console.error("Error al verificar/crear la tabla:", tableError)
      return defaultDemolitionSettings
    }

    const supabase = await getSupabase()
    if (!supabase) {
      console.error("Supabase client no disponible")
      return defaultDemolitionSettings
    }

    const { data, error } = await supabase
      .from("demolition_settings")
      .select("settings")
      .eq("project_id", projectId)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return defaultDemolitionSettings
      }
      throw error
    }

    if (data && data.settings) {
      return data.settings as DemolitionSettings
    }

    return defaultDemolitionSettings
  } catch (error) {
    console.error("Error al obtener ajustes de demolición:", error)
    return defaultDemolitionSettings
  }
}
