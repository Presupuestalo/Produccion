import { getSupabase } from "@/lib/supabase/client"
import type { Room, GlobalConfig, DemolitionSettings } from "@/types/calculator"
import { canAddRoom } from "./subscription-limits-service"

/**
 * Ensures the calculator_data table exists
 */
export async function ensureCalculatorTableExists(): Promise<boolean> {
  try {
    const supabase = await getSupabase()
    if (!supabase) {
      console.error("[v0] Supabase client no disponible")
      return false
    }

    const { error } = await supabase.from("calculator_data").select("id").limit(1)

    if (!error) {
      return true
    }

    if (!error.message.includes("does not exist")) {
      console.error("[v0] Error checking calculator_data table:", error)
      return false
    }

    const response = await fetch("/api/setup-calculator-table", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })

    if (!response.ok) {
      const data = await response.json()
      console.error("[v0] Error creating calculator_data table:", data.error || response.statusText)
      return false
    }

    return true
  } catch (error) {
    console.error("[v0] Unexpected error ensuring calculator table exists:", error)
    return false
  }
}

/**
 * Gets rooms for a project
 */
export async function getRooms(projectId: string): Promise<Room[]> {
  try {
    const supabase = await getSupabase()
    if (!supabase) {
      console.error("[v0] Supabase client no disponible")
      return []
    }

    const { data, error } = await supabase
      .from("calculator_data")
      .select("rooms")
      .eq("project_id", projectId)
      .order("updated_at", { ascending: false })
      .limit(1)

    if (error) {
      throw error
    }

    // Take the first row if multiple exist
    const firstRow = Array.isArray(data) && data.length > 0 ? data[0] : data
    return (firstRow?.rooms as Room[]) || []
  } catch (error) {
    console.error("[v0] Error getting rooms:", error)
    return []
  }
}

/**
 * Gets reform rooms for a project
 */
export async function getReformRooms(projectId: string): Promise<Room[]> {
  try {
    const supabase = await getSupabase()
    if (!supabase) {
      console.error("[v0] Supabase client no disponible")
      return []
    }

    const { data, error } = await supabase
      .from("calculator_data")
      .select("reform_rooms")
      .eq("project_id", projectId)
      .order("updated_at", { ascending: false })
      .limit(1)

    if (error) {
      throw error
    }

    const firstRow = Array.isArray(data) && data.length > 0 ? data[0] : data
    return (firstRow?.reform_rooms as Room[]) || []
  } catch (error) {
    console.error("[v0] Error getting reform rooms:", error)
    return []
  }
}

/**
 * Gets calculator configuration for a project
 */
export async function getCalculatorConfig(projectId: string): Promise<GlobalConfig | null> {
  try {
    const supabase = await getSupabase()
    if (!supabase) {
      console.error("[v0] Supabase client no disponible")
      return null
    }

    const { data, error } = await supabase
      .from("calculator_data")
      .select("global_config")
      .eq("project_id", projectId)
      .order("updated_at", { ascending: false })
      .limit(1)

    if (error) {
      throw error
    }

    const firstRow = Array.isArray(data) && data.length > 0 ? data[0] : data
    return (firstRow?.global_config as GlobalConfig) || null
  } catch (error) {
    console.error("[v0] Error getting calculator config:", error)
    return null
  }
}

/**
 * Gets demolition settings for a project
 */
export async function getDemolitionSettings(projectId: string): Promise<DemolitionSettings | null> {
  try {
    const supabase = await getSupabase()
    if (!supabase) {
      console.error("[v0] Supabase client no disponible")
      return null
    }

    const { data, error } = await supabase
      .from("calculator_data")
      .select("demolition_settings")
      .eq("project_id", projectId)
      .order("updated_at", { ascending: false })
      .limit(1)

    if (error) {
      throw error
    }

    const firstRow = Array.isArray(data) && data.length > 0 ? data[0] : data
    return (firstRow?.demolition_settings as DemolitionSettings) || null
  } catch (error) {
    console.error("[v0] Error getting demolition settings:", error)
    return null
  }
}

/**
 * Gets electrical configuration for a project
 */
export async function getElectricalConfig(projectId: string): Promise<any> {
  try {
    const supabase = await getSupabase()
    if (!supabase) {
      console.error("[v0] Supabase client no disponible")
      return null
    }

    const { data, error } = await supabase
      .from("calculator_data")
      .select("electrical_config")
      .eq("project_id", projectId)
      .order("updated_at", { ascending: false })
      .limit(1)

    if (error) {
      throw error
    }

    const firstRow = Array.isArray(data) && data.length > 0 ? data[0] : data
    return firstRow?.electrical_config || null
  } catch (error) {
    console.error("[v0] Error getting electrical config:", error)
    return null
  }
}

/**
 * Gets partitions for a project
 */
export async function getPartitions(projectId: string): Promise<any[]> {
  try {
    const supabase = await getSupabase()
    if (!supabase) {
      console.error("[v0] Supabase client no disponible")
      return []
    }

    const { data, error } = await supabase
      .from("calculator_data")
      .select("partitions")
      .eq("project_id", projectId)
      .order("updated_at", { ascending: false })
      .limit(1)

    if (error) {
      throw error
    }

    const firstRow = Array.isArray(data) && data.length > 0 ? data[0] : data
    return (firstRow?.partitions as any[]) || []
  } catch (error) {
    console.error("[v0] Error getting partitions:", error)
    return []
  }
}

/**
 * Gets wall linings for a project
 */
export async function getWallLinings(projectId: string): Promise<any[]> {
  try {
    const supabase = await getSupabase()
    if (!supabase) {
      console.error("[v0] Supabase client no disponible")
      return []
    }

    const { data, error } = await supabase
      .from("calculator_data")
      .select("wall_linings")
      .eq("project_id", projectId)
      .order("updated_at", { ascending: false })
      .limit(1)

    if (error) {
      throw error
    }

    const firstRow = Array.isArray(data) && data.length > 0 ? data[0] : data
    return (firstRow?.wall_linings as any[]) || []
  } catch (error) {
    console.error("[v0] Error getting wall linings:", error)
    return []
  }
}

/**
 * Saves all project data to Supabase
 */
export async function saveAllProjectData(
  projectId: string,
  data: {
    rooms?: Room[]
    reformRooms?: Room[]
    demolitionConfig?: GlobalConfig
    reformConfig?: GlobalConfig
    demolitionSettings?: DemolitionSettings
    electricalConfig?: any
    partitions?: any[]
    wallLinings?: any[]
  },
): Promise<boolean> {
  if (!projectId) {
    console.error("[v0] SAVE_SERVICE: No project ID provided")
    return false
  }

  try {
    const supabase = await getSupabase()
    if (!supabase) {
      console.error("[v0] Supabase client no disponible")
      return false
    }

    if (data.reformRooms !== undefined) {
      const { data: existingData } = await supabase
        .from("calculator_data")
        .select("reform_rooms")
        .eq("project_id", projectId)
        .order("updated_at", { ascending: false })
        .limit(1)

      const firstRow = Array.isArray(existingData) && existingData.length > 0 ? existingData[0] : existingData
      const existingRoomCount = firstRow?.reform_rooms ? (firstRow.reform_rooms as any[]).length : 0
      const newRoomCount = data.reformRooms.length

      // Only check if we're adding rooms
      if (newRoomCount > existingRoomCount) {
        const canAdd = await canAddRoom(projectId)
        if (!canAdd.allowed) {
          console.error("[v0] SAVE_SERVICE: Room limit exceeded:", canAdd.reason)
          throw new Error(canAdd.reason || "No puedes añadir más habitaciones")
        }
      }
    }

    console.log("[v0] SAVE_SERVICE: ========== INICIO GUARDADO ==========")
    console.log("[v0] SAVE_SERVICE: Project ID:", projectId)
    console.log("[v0] SAVE_SERVICE: Datos recibidos:", {
      hasRooms: !!data.rooms,
      roomsCount: data.rooms?.length || 0,
      hasReformRooms: !!data.reformRooms,
      reformRoomsCount: data.reformRooms?.length || 0,
      hasPartitions: !!data.partitions,
      partitionsCount: data.partitions?.length || 0,
      hasWallLinings: !!data.wallLinings,
      wallLiningsCount: data.wallLinings?.length || 0,
      hasReformConfig: !!data.reformConfig,
    })

    if (data.rooms !== undefined) {
      console.log("[v0] SAVE_SERVICE: Rooms data:", JSON.stringify(data.rooms))
    }

    // Ensure table exists
    const tableExists = await ensureCalculatorTableExists()
    if (!tableExists) {
      console.error("[v0] SAVE_SERVICE: Calculator table doesn't exist")
      return false
    }

    const { data: existingRecords, error: checkError } = await supabase
      .from("calculator_data")
      .select("id")
      .eq("project_id", projectId)
      .order("updated_at", { ascending: false })
      .limit(1)

    if (checkError) {
      console.error("[v0] SAVE_SERVICE: Error checking existing record:", checkError)
      throw checkError
    }

    const existingRecord = Array.isArray(existingRecords) && existingRecords.length > 0 ? existingRecords[0] : null

    // Prepare update data
    const updateData: any = {
      project_id: projectId,
      updated_at: new Date().toISOString(),
    }

    if (data.rooms !== undefined) {
      updateData.rooms = data.rooms
      console.log("[v0] SAVE_SERVICE: Guardando rooms:", data.rooms.length)
    }
    if (data.reformRooms !== undefined) {
      updateData.reform_rooms = data.reformRooms
      console.log("[v0] SAVE_SERVICE: Guardando reform_rooms:", data.reformRooms.length)
    }
    if (data.demolitionConfig !== undefined) {
      updateData.global_config = data.demolitionConfig
      console.log("[v0] SAVE_SERVICE: Guardando global_config")
    }
    if (data.reformConfig !== undefined) {
      updateData.reform_config = data.reformConfig
      console.log("[v0] SAVE_SERVICE: Guardando reform_config")
    }
    if (data.demolitionSettings !== undefined) {
      updateData.demolition_settings = data.demolitionSettings
      console.log("[v0] SAVE_SERVICE: Guardando demolition_settings")
    }
    if (data.electricalConfig !== undefined) {
      updateData.electrical_config = data.electricalConfig
      console.log("[v0] SAVE_SERVICE: Guardando electrical_config")
    }
    if (data.partitions !== undefined) {
      updateData.partitions = data.partitions
      console.log("[v0] SAVE_SERVICE: Guardando partitions:", data.partitions.length)
    }
    if (data.wallLinings !== undefined) {
      updateData.wall_linings = data.wallLinings
      console.log("[v0] SAVE_SERVICE: Guardando wall_linings:", data.wallLinings.length)
    }

    console.log("[v0] SAVE_SERVICE: Update data being sent:", JSON.stringify(updateData))

    let result
    if (existingRecord) {
      console.log("[v0] SAVE_SERVICE: Actualizando registro existente con ID:", existingRecord.id)
      result = await supabase.from("calculator_data").update(updateData).eq("id", existingRecord.id)
    } else {
      console.log("[v0] SAVE_SERVICE: Insertando nuevo registro")
      result = await supabase.from("calculator_data").insert([updateData])
    }

    if (result.error) {
      console.error("[v0] SAVE_SERVICE: Error en Supabase:", result.error)
      throw result.error
    }

    const { data: verifyRecords, error: verifyError } = await supabase
      .from("calculator_data")
      .select("rooms, reform_rooms")
      .eq("project_id", projectId)
      .order("updated_at", { ascending: false })
      .limit(1)

    if (verifyError) {
      console.error("[v0] SAVE_SERVICE: Error verificando guardado:", verifyError.message)
    } else if (verifyRecords && verifyRecords.length > 0) {
      const verifyData = verifyRecords[0]
      console.log("[v0] SAVE_SERVICE: Verificación - Rooms guardadas:", ((verifyData?.rooms as any[]) || []).length)
      console.log(
        "[v0] SAVE_SERVICE: Verificación - Reform rooms guardadas:",
        ((verifyData?.reform_rooms as any[]) || []).length,
      )
    } else {
      console.log("[v0] SAVE_SERVICE: Verificación - No se encontraron datos después del guardado")
    }

    console.log("[v0] SAVE_SERVICE: ========== GUARDADO EXITOSO ==========")
    return true
  } catch (error) {
    console.error("[v0] SAVE_SERVICE: Error al guardar:", error)
    return false
  }
}
/**
 * Saves only demolition settings to calculator_data table
 */
export async function saveDemolitionSettings(projectId: string, settings: DemolitionSettings): Promise<boolean> {
  if (!projectId) return false

  try {
    const supabase = await getSupabase()
    if (!supabase) return false

    const tableExists = await ensureCalculatorTableExists()
    if (!tableExists) return false

    const { data: existingRecords } = await supabase
      .from("calculator_data")
      .select("id")
      .eq("project_id", projectId)
      .order("updated_at", { ascending: false })
      .limit(1)

    const existingRecord = Array.isArray(existingRecords) && existingRecords.length > 0 ? existingRecords[0] : null

    const updateData = {
      project_id: projectId,
      demolition_settings: settings,
      updated_at: new Date().toISOString(),
    }

    let result
    if (existingRecord) {
      result = await supabase.from("calculator_data").update(updateData).eq("id", existingRecord.id)
    } else {
      result = await supabase.from("calculator_data").insert([updateData])
    }

    if (result.error) throw result.error
    return true
  } catch (error) {
    console.error("[v0] SAVE_DEMOLITION_SETTINGS: Error:", error)
    return false
  }
}
