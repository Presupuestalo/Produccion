import { supabase } from "@/lib/supabase/client"
import type { FloorPlanAnalysis } from "@/types/floor-plan-analysis"

/**
 * Guarda los resultados del análisis de un plano en la base de datos
 */
export async function saveFloorPlanAnalysis(
  projectId: string,
  planType: "before" | "after",
  analysis: FloorPlanAnalysis,
): Promise<boolean> {
  try {
    // Verificar si ya existe un análisis para este proyecto y tipo de plano
    const { data: existingData, error: checkError } = await supabase
      .from("floor_plan_analysis")
      .select("id")
      .eq("project_id", projectId)
      .eq("plan_type", planType)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      // Si hay un error que no sea "no se encontraron resultados"
      console.error("Error al verificar análisis existente:", checkError)
      throw checkError
    }

    let result
    if (existingData) {
      // Actualizar análisis existente
      result = await supabase
        .from("floor_plan_analysis")
        .update({
          analysis_data: analysis,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingData.id)
    } else {
      // Crear nuevo análisis
      result = await supabase.from("floor_plan_analysis").insert({
        project_id: projectId,
        plan_type: planType,
        analysis_data: analysis,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    }

    if (result.error) {
      throw result.error
    }

    return true
  } catch (error) {
    console.error("Error al guardar análisis de plano:", error)
    return false
  }
}

/**
 * Obtiene los resultados del análisis de un plano desde la base de datos
 */
export async function getFloorPlanAnalysis(
  projectId: string,
  planType: "before" | "after",
): Promise<FloorPlanAnalysis | null> {
  try {
    const { data, error } = await supabase
      .from("floor_plan_analysis")
      .select("analysis_data")
      .eq("project_id", projectId)
      .eq("plan_type", planType)
      .single()

    if (error) {
      // Si no se encuentran datos, devolver null
      if (error.code === "PGRST116") {
        return null
      }
      throw error
    }

    // Si hay datos, devolverlos
    if (data && data.analysis_data) {
      return data.analysis_data as FloorPlanAnalysis
    }

    return null
  } catch (error) {
    console.error("Error al obtener análisis de plano:", error)
    return null
  }
}

/**
 * Importa las habitaciones del análisis a la calculadora
 */
export async function importRoomsToCalculator(
  projectId: string,
  planType: "before" | "after",
  analysis: FloorPlanAnalysis,
): Promise<boolean> {
  try {
    // Convertir las habitaciones del análisis al formato de la calculadora
    const rooms = analysis.rooms.map((room) => ({
      id: room.id,
      type: mapRoomType(room.type),
      number: 1, // Por defecto, asignar número 1
      width: room.measurements.width,
      length: room.measurements.length,
      area: room.measurements.area,
      perimeter: calculatePerimeter(room.coordinates),
      wallSurface: calculateWallSurface(room.coordinates, 2.5), // Altura estándar de 2.5m
      floorMaterial: "Cerámico", // Por defecto
      wallMaterial: "Pintura", // Por defecto
      hasDoors: hasAdjacentDoors(room.id, analysis.openings),
      falseCeiling: false,
      moldings: false,
      demolishWall: false,
      demolishCeiling: false,
      removeFloor: true,
      removeWallTiles: false,
      removeBathroomElements: room.type === "bathroom",
      removeKitchenFurniture: room.type === "kitchen",
      removeBedroomFurniture: room.type === "bedroom",
      hasRadiator: false,
      removeSewagePipes: room.type === "bathroom",
      measurementMode: "rectangular",
      doors: countDoors(room.id, analysis.openings),
    }))

    // Guardar las habitaciones en la base de datos
    // Dependiendo del tipo de plano, guardarlas en rooms o reform_rooms
    const tableName = planType === "before" ? "rooms" : "reform_rooms"

    // Verificar si ya existe una configuración para este proyecto
    const { data: existingData, error: checkError } = await supabase
      .from("calculator_data")
      .select("id")
      .eq("project_id", projectId)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      // Si hay un error que no sea "no se encontraron resultados"
      console.error("Error al verificar configuración existente:", checkError)
      throw checkError
    }

    let result
    if (existingData) {
      // Actualizar configuración existente
      result = await supabase
        .from("calculator_data")
        .update({
          [tableName]: rooms,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingData.id)
    } else {
      // Crear nueva configuración
      result = await supabase.from("calculator_data").insert({
        project_id: projectId,
        [tableName]: rooms,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    }

    if (result.error) {
      throw result.error
    }

    return true
  } catch (error) {
    console.error("Error al importar habitaciones a la calculadora:", error)
    return false
  }
}

// Funciones auxiliares

function mapRoomType(type: string): string {
  const typeMap: Record<string, string> = {
    bedroom: "Dormitorio",
    bathroom: "Baño",
    kitchen: "Cocina",
    living: "Salón",
    dining: "Comedor",
    hall: "Pasillo",
    terrace: "Terraza",
  }

  return typeMap[type.toLowerCase()] || "Otro"
}

function calculatePerimeter(coordinates: [number, number][]): number {
  let perimeter = 0
  for (let i = 0; i < coordinates.length; i++) {
    const current = coordinates[i]
    const next = coordinates[(i + 1) % coordinates.length]
    const dx = next[0] - current[0]
    const dy = next[1] - current[1]
    perimeter += Math.sqrt(dx * dx + dy * dy)
  }
  return Number(perimeter.toFixed(2))
}

function calculateWallSurface(coordinates: [number, number][], height: number): number {
  const perimeter = calculatePerimeter(coordinates)
  return Number((perimeter * height).toFixed(2))
}

function hasAdjacentDoors(roomId: string, openings: any[]): boolean {
  return openings.some((opening) => opening.type === "door" && opening.connects.includes(roomId))
}

function countDoors(roomId: string, openings: any[]): number {
  return openings.filter((opening) => opening.type === "door" && opening.connects.includes(roomId)).length
}
