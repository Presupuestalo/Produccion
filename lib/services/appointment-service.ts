import { supabase } from "@/lib/supabase/client"
import type { ProjectAppointment, ProjectAppointmentFormData, ProjectActivityFormData } from "@/types/project"
import { v4 as uuidv4 } from "uuid"
import { createProjectActivity } from "./project-service"

// Función para crear una cita
export async function createAppointment(appointmentData: ProjectAppointmentFormData): Promise<ProjectAppointment> {
  try {
    const { data: session } = await supabase.auth.getSession()
    if (!session.session) {
      throw new Error("No hay sesión activa")
    }

    const newAppointment = {
      id: uuidv4(),
      ...appointmentData,
      user_id: session.session.user.id,
      created_at: new Date().toISOString(),
    }

    // Verificar si la tabla existe
    await ensureAppointmentsTableExists()

    const { data, error } = await supabase.from("project_appointments").insert(newAppointment).select()

    if (error) {
      console.error("Error al insertar cita:", error)
      throw error
    }

    return data[0] as ProjectAppointment
  } catch (error) {
    console.error("Error al crear la cita:", error)
    throw error
  }
}

// Función para obtener las citas de un proyecto
export async function getProjectAppointments(projectId: string): Promise<ProjectAppointment[]> {
  try {
    // Verificar si la tabla existe
    await ensureAppointmentsTableExists()

    const { data, error } = await supabase
      .from("project_appointments")
      .select("*")
      .eq("project_id", projectId)
      .order("date", { ascending: true })

    if (error) {
      // Si la tabla no existe, devolver un array vacío
      if (error.message.includes("does not exist")) {
        return []
      }
      console.error("Error al obtener citas:", error)
      throw error
    }

    return data as ProjectAppointment[]
  } catch (error) {
    console.error(`Error al obtener citas del proyecto ${projectId}:`, error)
    return []
  }
}

// Función para obtener todas las citas del usuario
export async function getAllAppointments(): Promise<ProjectAppointment[]> {
  try {
    const { data: session } = await supabase.auth.getSession()
    if (!session.session) {
      throw new Error("No hay sesión activa")
    }

    // Verificar si la tabla existe
    await ensureAppointmentsTableExists()

    // 1. Obtener las citas
    const { data: appointments, error } = await supabase
      .from("project_appointments")
      .select("*")
      .eq("user_id", session.session.user.id)
      .order("date", { ascending: true })

    if (error) {
      if (error.message.includes("does not exist")) {
        return []
      }
      console.error("[v0] Error al obtener citas:", {
        message: error.message,
        code: error.code,
        details: error.details,
      })
      throw error
    }

    if (!appointments || appointments.length === 0) {
      return []
    }

    // 2. Obtener los títulos de los proyectos para mapeo manual (más robusto)
    const projectIds = [...new Set(appointments.map((a: any) => a.project_id))].filter(Boolean)
    const { data: projectsData, error: projectsError } = await supabase
      .from("projects")
      .select("id, title")
      .in("id", projectIds)

    if (projectsError) {
      console.error("[v0] Error al obtener proyectos para las citas:", projectsError)
    }

    const projectTitlesMap = new Map<string, string>()
    if (projectsData) {
      projectsData.forEach((p: any) => projectTitlesMap.set(p.id, p.title))
    }

    // 3. Mapear los resultados para incluir projects: { title }
    return appointments.map((appointment: any) => ({
      ...appointment,
      projects: {
        title: projectTitlesMap.get(appointment.project_id) || "Proyecto sin título"
      }
    })) as ProjectAppointment[]
  } catch (error) {
    console.error("Error al obtener todas las citas:", error)
    return []
  }
}

// Función para actualizar una cita
export async function updateAppointment(
  appointmentId: string,
  updates: Partial<ProjectAppointment>,
): Promise<ProjectAppointment> {
  try {
    const { data, error } = await supabase.from("project_appointments").update(updates).eq("id", appointmentId).select()

    if (error) {
      console.error("Error al actualizar cita:", error)
      throw error
    }

    return data[0] as ProjectAppointment
  } catch (error) {
    console.error(`Error al actualizar la cita ${appointmentId}:`, error)
    throw error
  }
}

// Función para eliminar una cita
export async function deleteAppointment(appointmentId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("project_appointments").delete().eq("id", appointmentId)

    if (error) {
      console.error("Error al eliminar cita:", error)
      throw error
    }

    return true
  } catch (error) {
    console.error(`Error al eliminar la cita ${appointmentId}:`, error)
    throw error
  }
}

// Función para marcar una cita como completada y crear una actividad
export async function completeAppointment(appointment: ProjectAppointment): Promise<ProjectAppointment> {
  try {
    // Crear una actividad a partir de la cita
    const activityData: ProjectActivityFormData = {
      project_id: appointment.project_id,
      description: `${appointment.title}${appointment.description ? `: ${appointment.description}` : ""}${appointment.location ? ` en ${appointment.location}` : ""
        }`,
      date: appointment.date,
      type: "visita", // Por defecto, las citas se convierten en visitas
    }

    const activity = await createProjectActivity(activityData)

    // Actualizar la cita como completada y asociarla con la actividad
    const updatedAppointment = await updateAppointment(appointment.id, {
      status: "completada",
      activity_id: activity.id,
    })

    return updatedAppointment
  } catch (error) {
    console.error(`Error al completar la cita ${appointment.id}:`, error)
    throw error
  }
}

// Función para asegurar que la tabla de citas existe
async function ensureAppointmentsTableExists(): Promise<boolean> {
  try {
    // Verificar si la tabla ya existe
    const { error } = await supabase.from("project_appointments").select("id").limit(1)

    // Si no hay error, la tabla ya existe
    if (!error) {
      return true
    }

    // Si el error no es porque la tabla no existe, algo más está mal
    if (!error.message.includes("does not exist")) {
      console.error("Error al verificar la tabla project_appointments:", error)
      return false
    }

    // La tabla no existe, vamos a intentar crearla usando el endpoint
    console.log("Intentando crear tabla project_appointments a través del endpoint...")

    const response = await fetch("/api/setup-appointments-table", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const data = await response.json()

      // Si necesita creación manual, mostrar instrucciones en la consola
      if (data.needsManualCreation) {
        console.error("Es necesario crear la tabla manualmente. Instrucciones:", data.instructions)
        alert("Es necesario crear la tabla de citas manualmente. Por favor, contacta al administrador del sistema.")
      }

      console.error("Error al crear la tabla project_appointments:", data.error || response.statusText)
      return false
    }

    console.log("Tabla project_appointments creada correctamente")
    return true
  } catch (error) {
    console.error("Error inesperado al verificar/crear la tabla project_appointments:", error)
    return false
  }
}
