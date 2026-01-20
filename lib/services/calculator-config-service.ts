import { createBrowserClient } from "@supabase/ssr"
import type { GlobalConfig } from "@/types/calculator"

/**
 * Guarda la configuración global de la calculadora en Supabase
 */
export async function saveCalculatorConfig(projectId: string, config: GlobalConfig): Promise<boolean> {
  try {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    // Verificar si ya existe una configuración para este proyecto
    const { data: existingData, error: checkError } = await supabase
      .from("calculator_data")
      .select("id")
      .eq("project_id", projectId)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error al verificar configuración existente:", checkError)
      throw checkError
    }

    let result
    if (existingData) {
      result = await supabase
        .from("calculator_data")
        .update({
          global_config: config,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingData.id)
    } else {
      result = await supabase.from("calculator_data").insert({
        project_id: projectId,
        global_config: config,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    }

    if (result.error) {
      throw result.error
    }

    return true
  } catch (error) {
    console.error("Error al guardar configuración de calculadora:", error)
    return false
  }
}

/**
 * Obtiene la configuración global de la calculadora desde Supabase
 */
export async function getCalculatorConfig(projectId: string): Promise<GlobalConfig | null> {
  try {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    const { data, error } = await supabase
      .from("calculator_data")
      .select("global_config")
      .eq("project_id", projectId)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return null
      }
      throw error
    }

    if (data && data.global_config) {
      return data.global_config as GlobalConfig
    }

    return null
  } catch (error) {
    console.error("Error al obtener configuración de calculadora:", error)
    return null
  }
}
