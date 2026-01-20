import { supabase } from "@/lib/supabase/client"
import type { Room, GlobalConfig, DemolitionSettings } from "@/types/calculator"

// Interfaz para los datos del proyecto
export interface ProjectData {
  rooms: Room[]
  reformRooms: Room[]
  demolitionConfig?: GlobalConfig
  reformConfig?: GlobalConfig
  demolitionSettings?: DemolitionSettings
  lastUpdated: string
  version: number // Para control de versiones
}

// Modificar la función getProjectData para priorizar Supabase
export async function getProjectData(projectId: string): Promise<ProjectData | null> {
  if (!projectId) {
    console.error("No se puede cargar sin ID de proyecto")
    return null
  }

  try {
    console.log(`Obteniendo datos del proyecto ${projectId} desde Supabase...`)

    // Intentar cargar desde Supabase primero
    const { data, error } = await supabase
      .from("calculator_data")
      .select("rooms, reform_rooms, global_config, demolition_settings, updated_at, data_version")
      .eq("project_id", projectId)
      .single()

    if (error) {
      if (error.code !== "PGRST116") {
        // No es "no se encontraron resultados"
        console.error("Error al cargar datos desde Supabase:", error)
      }

      console.log("No se encontraron datos en Supabase, intentando cargar desde localStorage...")

      // Si no hay datos en Supabase, intentar cargar desde localStorage
      if (typeof window !== "undefined") {
        const storageKey = `presupuestalo_${projectId}`
        const localData = localStorage.getItem(storageKey)

        if (localData) {
          try {
            const projectData = JSON.parse(localData) as ProjectData
            console.log(`Datos cargados desde localStorage para proyecto ${projectId}`)

            // Guardar estos datos en Supabase para sincronizar
            saveProjectData(projectId, projectData)

            return projectData
          } catch (e) {
            console.error("Error al parsear datos de localStorage:", e)
          }
        }
      }

      return null
    }

    // Convertir datos de Supabase al formato ProjectData
    const projectData: ProjectData = {
      rooms: data.rooms || [],
      reformRooms: data.reform_rooms || [],
      demolitionConfig: data.global_config,
      demolitionSettings: data.demolition_settings,
      lastUpdated: data.updated_at,
      version: data.data_version || 0,
    }

    // Guardar en localStorage para acceso más rápido la próxima vez
    if (typeof window !== "undefined") {
      const storageKey = `presupuestalo_${projectId}`
      localStorage.setItem(storageKey, JSON.stringify(projectData))
    }

    console.log(`Datos cargados desde Supabase para proyecto ${projectId}`)
    return projectData
  } catch (error) {
    console.error("Error al cargar datos del proyecto:", error)
    return null
  }
}

// Modificar la función saveProjectData para priorizar Supabase
export async function saveProjectData(projectId: string, data: Partial<ProjectData>): Promise<boolean> {
  if (!projectId) {
    console.error("No se puede guardar sin ID de proyecto")
    return false
  }

  try {
    console.log(`Guardando datos del proyecto ${projectId} en Supabase...`)

    // 1. Primero, obtener los datos actuales para no sobrescribir nada
    const { data: existingData, error: checkError } = await supabase
      .from("calculator_data")
      .select("id, rooms, reform_rooms, global_config, demolition_settings, data_version")
      .eq("project_id", projectId)
      .single()

    // 2. Combinar los datos actuales con los nuevos
    const mergedData: ProjectData = {
      rooms: data.rooms || (existingData?.rooms as Room[]) || [],
      reformRooms: data.reformRooms || (existingData?.reform_rooms as Room[]) || [],
      demolitionConfig: data.demolitionConfig || existingData?.global_config,
      reformConfig: data.reformConfig || existingData?.global_config,
      demolitionSettings: data.demolitionSettings || existingData?.demolition_settings,
      lastUpdated: new Date().toISOString(),
      version: ((existingData?.data_version as number) || 0) + 1,
    }

    // 3. Guardar en Supabase
    let result
    if (existingData) {
      // Actualizar datos existentes
      result = await supabase
        .from("calculator_data")
        .update({
          rooms: mergedData.rooms,
          reform_rooms: mergedData.reformRooms,
          global_config: mergedData.demolitionConfig,
          demolition_settings: mergedData.demolitionSettings,
          updated_at: mergedData.lastUpdated,
          data_version: mergedData.version,
        })
        .eq("id", existingData.id)
    } else {
      // Crear nuevos datos
      result = await supabase.from("calculator_data").insert({
        project_id: projectId,
        rooms: mergedData.rooms,
        reform_rooms: mergedData.reformRooms,
        global_config: mergedData.demolitionConfig,
        demolition_settings: mergedData.demolitionSettings,
        created_at: mergedData.lastUpdated,
        updated_at: mergedData.lastUpdated,
        data_version: mergedData.version,
      })
    }

    if (result.error) {
      console.error("Error al guardar en Supabase:", result.error)
      return false
    }

    // 4. Guardar en localStorage como respaldo
    if (typeof window !== "undefined") {
      const storageKey = `presupuestalo_${projectId}`
      localStorage.setItem(storageKey, JSON.stringify(mergedData))

      // También crear un respaldo adicional con timestamp
      const backupKey = `presupuestalo_backup_${projectId}_${Date.now()}`
      localStorage.setItem(backupKey, JSON.stringify(mergedData))

      // Mantener solo los últimos 3 respaldos
      const backupKeys = Object.keys(localStorage)
        .filter((key) => key.startsWith(`presupuestalo_backup_${projectId}`))
        .sort()
        .reverse()

      if (backupKeys.length > 3) {
        backupKeys.slice(3).forEach((key) => localStorage.removeItem(key))
      }
    }

    console.log(`Datos del proyecto ${projectId} guardados correctamente (v${mergedData.version})`)
    return true
  } catch (error) {
    console.error("Error al guardar datos del proyecto:", error)
    return false
  }
}

/**
 * Recupera datos de respaldo si los datos principales están corruptos o perdidos
 */
export function recoverProjectData(projectId: string): ProjectData | null {
  if (!projectId) return null

  try {
    // Buscar todos los respaldos para este proyecto
    const backupKeys = Object.keys(localStorage)
      .filter((key) => key.startsWith(`presupuestalo_backup_${projectId}`))
      .sort()
      .reverse()

    if (backupKeys.length === 0) return null

    // Intentar cargar el respaldo más reciente
    const latestBackup = localStorage.getItem(backupKeys[0])
    if (!latestBackup) return null

    const recoveredData = JSON.parse(latestBackup) as ProjectData

    // Restaurar los datos principales
    const storageKey = `presupuestalo_${projectId}`
    localStorage.setItem(storageKey, latestBackup)

    console.log(`Datos recuperados desde respaldo para proyecto ${projectId}`)
    return recoveredData
  } catch (error) {
    console.error("Error al recuperar datos de respaldo:", error)
    return null
  }
}
