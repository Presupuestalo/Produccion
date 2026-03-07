import { createBrowserClient } from "@supabase/ssr"
import { getSupabase, refreshSession } from "@/lib/supabase/client"
import type { Project, ProjectFormData, ProjectActivity, ProjectActivityFormData } from "@/types/project"
import type { UserProfile } from "@/types/user"
import { v4 as uuidv4 } from "uuid"
import { canCreateProject } from "./subscription-limits-service"
import { BudgetService } from "./budget-service"

// Colores predefinidos para los proyectos
const projectColors = [
  "bg-purple-500",
  "bg-blue-500",
  "bg-green-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-cyan-500",
  "bg-indigo-500",
  "bg-amber-500",
  "bg-red-500",
]

// Función para obtener clientes únicos de los proyectos
export async function getProjectClients() {
  try {
    const supabase = await getSupabase()

    if (!supabase) {
      console.error("[v0] getProjectClients - Supabase client not available")
      return []
    }

    const { data: session } = await supabase.auth.getSession()
    if (!session.session) {
      throw new Error("No hay sesión activa")
    }

    const { data, error } = await supabase.from("projects").select("client").eq("user_id", session.session.user.id)

    if (error) {
      console.error("Error al obtener clientes de proyectos:", error)
      throw error
    }

    // Extraer nombres de clientes únicos y ordenarlos alfabéticamente
    const uniqueClients = [...new Set(data.map((project: { client: string }) => project.client))]
      .filter((client): client is string => typeof client === "string" && client.trim() !== "")
      .sort((a, b) => a.localeCompare(b))

    return uniqueClients
  } catch (error) {
    console.error("Error al obtener clientes de proyectos:", error)
    return []
  }
}

// Función para normalizar los nombres de campos
function normalizeProject(project: any): Project {
  return {
    id: project.id,
    title: project.title || "",
    description: project.description || "",
    client: project.client || "",
    client_dni: project.client_dni || "",
    clientEmail: project.client_email || "",
    clientPhone: project.client_phone || "",
    client_address: project.client_address || "",
    clientNotes: project.client_notes || "",
    project_address: project.project_address || "",
    country_code: project.country_code || "ES",
    progress: project.progress || 0,
    status: project.status || "Borrador",
    dueDate: project.dueDate || project.duedate || "",
    duedate: project.duedate || project.dueDate || "",
    budget: typeof project.budget === "number" ? project.budget : 0,
    color: project.color || projectColors[0],
    created_at: project.created_at || new Date().toISOString(),
    user_id: project.user_id || "",
    license_status: project.license_status || "No iniciado",
    license_date: project.license_date || "",
    contract_signed: project.contract_signed || false,
    contract_date: project.contract_date || "",
    street: project.street || "",
    project_floor: typeof project.project_floor === "number" ? project.project_floor : 0,
    door: project.door || "",
    city: project.city || "",
    province: project.province || "",
    postal_code: project.postal_code || "",
    client_postal_code: project.client_postal_code || "",
    country: project.country || "España", // @deprecated
    ceiling_height: typeof project.ceiling_height === "number" ? project.ceiling_height : 2.6,
    structure_type: project.structure_type || "",
    has_elevator: project.has_elevator || "Sin información de ascensor",
  }
}

// Modificar la función getProjects para manejar mejor los errores de sesión
export async function getProjects() {
  try {
    console.log("[v0] getProjects - Creando cliente Supabase...")
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    console.log("[v0] getProjects - Cliente creado, verificando sesión...")
    const { data: session, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      console.error("[v0] getProjects - Error al obtener sesión:", sessionError)
      return []
    }

    const userId = session.session?.user.id

    if (!userId) {
      console.log("[v0] getProjects - No hay userId")
      return []
    }

    console.log("[v0] getProjects - Consultando proyectos para userId:", userId)

    // Intentar obtener los proyectos
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] getProjects - Error de Supabase:", error)
      // Verificar si el error es porque la tabla no existe
      if (error.message.includes("does not exist")) {
        console.error("La tabla 'projects' no existe en la base de datos. Por favor, crea la tabla primero.")
        return null
      }
      return []
    }

    console.log("[v0] getProjects - Proyectos obtenidos:", data?.length || 0)
    console.log("[v0] getProjects - Datos de proyectos:", JSON.stringify(data, null, 2))

    // Si no hay datos, devolver un array vacío
    if (!data || data.length === 0) {
      console.log("[v0] getProjects - No hay proyectos, devolviendo array vacío")
      return []
    }

    // Normalizar cada proyecto para manejar diferencias en nombres de campos
    const normalizedProjects = data.map((project) => normalizeProject(project))
    console.log("[v0] getProjects - Proyectos normalizados:", normalizedProjects.length)
    return normalizedProjects
  } catch (error) {
    console.error("[v0] getProjects - Error al obtener proyectos:", error)
    // Devolver array vacío en lugar de propagar el error
    return []
  }
}

// Modificar la función getProjectById para mejorar el manejo de errores
export async function getProjectById(id: string, supabaseClient?: any) {
  try {
    // Verificar que el ID sea válido
    if (!id || typeof id !== "string") {
      return null
    }

    // Usar el cliente proporcionado o inicializar uno nuevo
    let supabase = supabaseClient

    if (!supabase) {
      // Obtener el cliente de Supabase (browser por defecto)
      supabase = await getSupabase()
    }

    if (!supabase) {
      console.error("[v0] getProjectById - Supabase client not available")
      return null
    }

    // Obtener la sesión actual
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      console.error("[v0] getProjectById - Session error:", sessionError)
      return null
    }

    if (!sessionData.session) {
      // Intentar refrescar la sesión
      const refreshedSession = await refreshSession()
      if (!refreshedSession) {
        console.log("[v0] getProjectById - No se pudo refrescar la sesión")
        return null
      }
      // Usar la sesión refrescada
      sessionData.session = refreshedSession
    }

    // Intentar obtener el proyecto
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .eq("user_id", sessionData.session.user.id)
      .single()

    if (error) {
      // Si el error es que no se encontró el proyecto, devolver null
      if (error.code === "PGRST116") {
        console.error(`[v0] No se encontró el proyecto con ID: ${id}`)
        return null
      }
      console.error("[v0] getProjectById - Error de Supabase:", error)
      return null
    }

    // Si no hay datos, devolver null
    if (!data) {
      console.error(`[v0] No hay datos para el proyecto con ID: ${id}`)
      return null
    }

    // Normalizar el proyecto
    return normalizeProject(data)
  } catch (error) {
    // Registrar el error y devolver null
    console.error(`[v0] Error inesperado al obtener el proyecto con ID ${id}:`, error)
    return null
  }
}

export async function createProject(projectData: ProjectFormData, userProfile?: UserProfile) {
  try {
    const canCreate = await canCreateProject()
    if (!canCreate.allowed) {
      throw new Error(canCreate.reason || "No puedes crear más proyectos")
    }

    const supabase = await getSupabase()

    if (!supabase) {
      throw new Error("Supabase client not available")
    }

    const { data: session } = await supabase.auth.getSession()
    if (!session.session) {
      throw new Error("No hay sesión activa")
    }

    const color = projectData.color || projectColors[Math.floor(Math.random() * projectColors.length)]

    let hasElevator = "Sin información de ascensor"
    if (projectData.has_elevator === "Sí" || projectData.has_elevator === "true" || projectData.has_elevator === true) {
      hasElevator = "Sí"
    } else if (
      projectData.has_elevator === "No" ||
      projectData.has_elevator === "false" ||
      projectData.has_elevator === false
    ) {
      hasElevator = "No"
    }

    let clientData = {
      client: projectData.client || "Cliente sin nombre",
      client_email: projectData.clientEmail || "",
      client_phone: projectData.clientPhone || "",
      client_address: projectData.client_address || "",
      client_dni: projectData.client_dni || "",
    }

    // If user is homeowner, use their profile data
    if (userProfile && userProfile.user_type === "homeowner") {
      clientData = {
        client: userProfile.full_name || session.session.user.email || "Propietario",
        client_email: session.session.user.email || "",
        client_phone: userProfile.phone || "",
        client_address: userProfile.address_street
          ? `${userProfile.address_street}${userProfile.address_city ? ", " + userProfile.address_city : ""}${userProfile.address_province ? ", " + userProfile.address_province : ""}`
          : "",
        client_dni: userProfile.dni_nif || "",
      }
    }

    const newProject = {
      id: uuidv4(),
      title: projectData.title || "Nuevo proyecto",
      description: projectData.description || "",
      ...clientData,
      client_notes: projectData.clientNotes || "",
      project_address: projectData.project_address || "",
      country_code: projectData.country_code || "ES",
      progress: calculateProgress(projectData.status || "Borrador"),
      status: projectData.status || "Borrador",
      color,
      user_id: session.session.user.id,
      duedate: projectData.dueDate || new Date().toISOString().split("T")[0],
      budget: projectData.budget || 0,
      license_status: projectData.license_status || "No iniciado",
      license_date: projectData.license_date || "",
      contract_signed: projectData.contract_signed || false,
      contract_date: projectData.contract_date || "",
      street: projectData.street || "",
      project_floor:
        typeof projectData.project_floor === "string"
          ? Number.parseInt(projectData.project_floor) || 0
          : projectData.project_floor || 0,
      door: projectData.door || "",
      city: projectData.city || "",
      province: projectData.province || "",
      postal_code: projectData.postal_code || "",
      country: projectData.country || "España", // @deprecated
      ceiling_height:
        typeof projectData.ceiling_height === "string"
          ? Number.parseFloat(projectData.ceiling_height.replace(",", ".")) || 2.6
          : projectData.ceiling_height || 2.6,
      structure_type: projectData.structure_type || "",
      has_elevator: hasElevator,
    }

    const { data, error } = await supabase.from("projects").insert(newProject).select()

    if (error) {
      console.error("[v0] createProject - Error al insertar proyecto:", error)

      // Si el error es por la columna postal_code, reintentamos sin ella
      if (error.message.includes("postal_code") || error.message.includes("column \"postal_code\" of relation \"projects\" does not exist")) {
        console.warn("[v0] createProject - Reintentando sin la columna postal_code...")
        const { postal_code, ...projectWithoutPC } = newProject
        const { data: retryData, error: retryError } = await supabase.from("projects").insert(projectWithoutPC).select()

        if (!retryError && retryData && retryData.length > 0) {
          // Si logramos insertar el proyecto, guardamos el CP en la calculadora
          if (newProject.postal_code) {
            const { saveCalculatorConfig } = await import("./calculator-config-service")
            await saveCalculatorConfig(newProject.id, {
              postalCode: newProject.postal_code,
              structureType: newProject.structure_type as any
            })
          }
          return normalizeProject(retryData[0])
        }
        if (retryError) throw retryError
      } else {
        throw error
      }
    }

    // Si todo fue bien, sincronizar con la calculadora por si acaso
    if (newProject.id) {
      const { saveCalculatorConfig } = await import("./calculator-config-service")
      await saveCalculatorConfig(newProject.id, {
        postalCode: newProject.postal_code,
        structureType: newProject.structure_type as any
      })
    }

    return normalizeProject(data[0])
  } catch (error) {
    console.error("Error al crear el proyecto:", error)
    throw error
  }
}

export async function updateProject(id: string, projectData: Partial<Project>) {
  try {
    console.log("[v0] updateProject - ID del proyecto:", id)
    console.log("[v0] updateProject - Datos recibidos:", projectData)

    const supabase = await getSupabase()

    if (!supabase) {
      throw new Error("Supabase client not available")
    }

    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData.session) {
      throw new Error("No hay sesión activa")
    }

    const dataToUpdate: any = { ...projectData }

    if (projectData.status) {
      dataToUpdate.progress = calculateProgress(projectData.status)
    }

    if (projectData.dueDate) {
      dataToUpdate.duedate = projectData.dueDate
      delete dataToUpdate.dueDate
    }

    if (projectData.country_code !== undefined) {
      dataToUpdate.country_code = projectData.country_code
    }

    if (dataToUpdate.client_dni !== undefined) {
      dataToUpdate.client_dni = dataToUpdate.client_dni
    }

    if (dataToUpdate.clientEmail !== undefined) {
      dataToUpdate.client_email = dataToUpdate.clientEmail
      delete dataToUpdate.clientEmail
    }

    if (dataToUpdate.clientPhone !== undefined) {
      dataToUpdate.client_phone = dataToUpdate.clientPhone
      delete dataToUpdate.clientPhone
    }

    if (dataToUpdate.clientNotes !== undefined) {
      dataToUpdate.client_notes = dataToUpdate.clientNotes
      delete dataToUpdate.clientNotes
    }

    if (dataToUpdate.client_country !== undefined) {
      dataToUpdate.client_country = dataToUpdate.client_country
    }

    if (dataToUpdate.client_street !== undefined) {
      dataToUpdate.client_street = dataToUpdate.client_street
    }

    if (dataToUpdate.client_city !== undefined) {
      dataToUpdate.client_city = dataToUpdate.client_city
    }

    if (dataToUpdate.client_province !== undefined) {
      dataToUpdate.client_province = dataToUpdate.client_province
    }

    if (dataToUpdate.street !== undefined) {
      dataToUpdate.street = dataToUpdate.street
    }

    if (dataToUpdate.project_street !== undefined) {
      dataToUpdate.street = dataToUpdate.project_street
      delete dataToUpdate.project_street
    }

    if (dataToUpdate.project_floor !== undefined) {
      dataToUpdate.project_floor =
        typeof dataToUpdate.project_floor === "string"
          ? Number.parseInt(dataToUpdate.project_floor) || 0
          : dataToUpdate.project_floor || 0
    }

    if (dataToUpdate.door !== undefined) {
      dataToUpdate.door = dataToUpdate.door
    }

    if (dataToUpdate.project_door !== undefined) {
      dataToUpdate.door = dataToUpdate.project_door
      delete dataToUpdate.project_door
    }

    if (dataToUpdate.city !== undefined) {
      dataToUpdate.city = dataToUpdate.city
    }

    if (dataToUpdate.project_city !== undefined) {
      dataToUpdate.city = dataToUpdate.project_city
      delete dataToUpdate.project_city
    }

    if (dataToUpdate.province !== undefined) {
      dataToUpdate.province = dataToUpdate.province
    }

    if (dataToUpdate.project_province !== undefined) {
      dataToUpdate.province = dataToUpdate.project_province
      delete dataToUpdate.project_province
    }

    if (dataToUpdate.postal_code !== undefined) {
      // Intento de guardado en columna, pero si falla no bloqueamos el resto del proceso
      // La persistencia real garantizada será en calculator_data
      dataToUpdate.postal_code = dataToUpdate.postal_code
    }

    if (dataToUpdate.client_postal_code !== undefined) {
      dataToUpdate.client_postal_code = dataToUpdate.client_postal_code
    }

    if (dataToUpdate.country !== undefined) {
      dataToUpdate.country = dataToUpdate.country
    }

    if (dataToUpdate.ceiling_height !== undefined) {
      dataToUpdate.ceiling_height =
        typeof dataToUpdate.ceiling_height === "string"
          ? Number.parseFloat(dataToUpdate.ceiling_height.replace(",", ".")) || 2.6
          : dataToUpdate.ceiling_height || 2.6
    }

    if (dataToUpdate.structure_type !== undefined) {
      dataToUpdate.structure_type = dataToUpdate.structure_type
    }

    if (dataToUpdate.has_elevator !== undefined) {
      let hasElevator = "Sin información de ascensor"
      if (
        dataToUpdate.has_elevator === "Sí" ||
        dataToUpdate.has_elevator === "true" ||
        dataToUpdate.has_elevator === true
      ) {
        hasElevator = "Sí"
      } else if (
        dataToUpdate.has_elevator === "No" ||
        dataToUpdate.has_elevator === "false" ||
        dataToUpdate.has_elevator === false
      ) {
        hasElevator = "No"
      }
      dataToUpdate.has_elevator = hasElevator
    }

    console.log("[v0] updateProject - Datos procesados para actualizar en DB:", dataToUpdate)

    const { data, error } = await supabase.from("projects").update(dataToUpdate).eq("id", id).select()

    if (error) {
      console.error(`[v0] updateProject - Error al actualizar el proyecto con ID ${id}:`, error.message || error)

      // Si el error es por la columna postal_code, reintentamos sin ella
      if (error.message?.includes("postal_code") || error.message?.includes("column \"postal_code\" of relation \"projects\" does not exist")) {
        console.warn("[v0] updateProject - Reintentando sin la columna postal_code...")
        const { postal_code, ...dataWithoutPC } = dataToUpdate
        const { data: retryData, error: retryError } = await supabase.from("projects").update(dataWithoutPC).eq("id", id).select()

        if (!retryError && retryData && retryData.length > 0) {
          // Si logramos actualizar el proyecto, guardamos el CP en la calculadora para que no se pierda
          const { saveCalculatorConfig } = await import("./calculator-config-service")
          await saveCalculatorConfig(id, {
            postalCode: dataToUpdate.postal_code,
            structureType: dataToUpdate.structure_type as any
          })
          return normalizeProject(retryData[0])
        }
        if (retryError) throw new Error(retryError.message)
      } else {
        throw new Error(error.message)
      }
    }

    // Sincronizar siempre con la calculadora para asegurar consistencia
    const { saveCalculatorConfig } = await import("./calculator-config-service")
    await saveCalculatorConfig(id, {
      postalCode: dataToUpdate.postal_code,
      structureType: dataToUpdate.structure_type as any
    })

    if (!data || data.length === 0) {
      console.error("[v0] updateProject - RLS rechazó la actualización: no hay datos devueltos")
      throw new Error("No tienes permiso para editar este proyecto. Verifica que seas el propietario.")
    }

    console.log("[v0] updateProject - Actualización exitosa, datos devueltos:", data)

    return normalizeProject(data[0])
  } catch (error: any) {
    console.error(`[v0] updateProject - Error al actualizar el proyecto con ID ${id}:`, error.message || error)
    throw error
  }
}

export async function deleteProject(id: string) {
  try {
    const supabase = await getSupabase()

    if (!supabase) {
      throw new Error("Supabase client not available")
    }

    // Las tablas quote_requests y quote_offers no tienen project_id (son flujos independientes)
    // El marketplace correcto que usa project_id es lead_requests


    const { data: activeLeadRequest, error: leadCheckError } = await supabase
      .from("lead_requests")
      .select("id, status")
      .eq("project_id", id)
      .in("status", ["open", "active"])
      .maybeSingle()

    if (leadCheckError && leadCheckError.code !== "42P01") {
      console.error("[v0] Error al verificar marketplace leads:", leadCheckError.message || leadCheckError.details || leadCheckError)
    }

    if (activeLeadRequest) {
      throw new Error(
        "No puedes eliminar este proyecto porque tiene una solicitud activa en el marketplace. " +
        "Debes eliminar la solicitud primero.",
      )
    }



    // 1. Obtener URLs de archivos para eliminarlos del storage
    const { data: plans } = await supabase.from("project_floor_plans").select("image_url").eq("project_id", id)
    const { data: photos } = await supabase.from("room_photos").select("storage_path").eq("project_id", id)
    const { data: licenses } = await supabase.from("license_documents").select("file_url").eq("project_id", id)

    // Función auxiliar para extraer bucket y ruta del storage desde una URL
    const parseStorageUrl = (urlStr: string) => {
      try {
        const url = new URL(urlStr)
        const pathParts = url.pathname.split("/")
        const publicIndex = pathParts.indexOf("public")
        if (publicIndex !== -1 && publicIndex < pathParts.length - 2) {
          return {
            bucket: pathParts[publicIndex + 1],
            path: pathParts.slice(publicIndex + 2).join("/"),
          }
        }
      } catch (e) {
        // Fallback para rutas relativas o formatos antiguos
        const match = urlStr.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)/)
        if (match) {
          return { bucket: match[1], path: match[2].split("?")[0] }
        }
      }
      return null
    }

    // Eliminar el proyecto principal (esto activará borrados en cascada si están configurados, 
    // pero lo haremos manual para asegurar integridad total)
    const { error: deleteProjectError } = await supabase.from("projects").delete().eq("id", id)

    if (deleteProjectError) {
      console.error("Error al eliminar proyecto:", deleteProjectError)
      throw new Error(`Error al eliminar: ${deleteProjectError.message}`)
    }

    // Ejecutar limpieza profunda de datos relacionados
    try {
      // A. Limpieza de Storage
      const storageCleanup: Promise<any>[] = []

      // Planos (pueden estar en project-files o planos-reconocidos)
      plans?.forEach((p: { image_url: string | null }) => {
        if (p.image_url) {
          const parsed = parseStorageUrl(p.image_url)
          if (parsed) storageCleanup.push(supabase.storage.from(parsed.bucket).remove([parsed.path]))
        }
      })

      // Fotos de habitaciones
      photos?.forEach((p: { storage_path: string | null }) => {
        if (p.storage_path) {
          storageCleanup.push(supabase.storage.from("planos-reconocidos").remove([p.storage_path]))
        }
      })

      // Licencias
      licenses?.forEach((l: { file_url: string | null }) => {
        if (l.file_url) {
          const parsed = parseStorageUrl(l.file_url)
          if (parsed) storageCleanup.push(supabase.storage.from(parsed.bucket).remove([parsed.path]))
        }
      })

      // B. Limpieza de Base de Datos (Tablas que no tengan cascada o por seguridad)
      const dbCleanup = [
        // 1. Presupuestos y sus partidas
        BudgetService.deleteAllBudgets(id, supabase),

        // 2. Registro de planos
        supabase.from("project_floor_plans").delete().eq("project_id", id),

        // 3. Datos de la calculadora y configuraciones
        supabase.from("calculator_data").delete().eq("project_id", id),
        supabase.from("demolition_settings").delete().eq("project_id", id),
        supabase.from("budget_settings").delete().eq("project_id", id),

        // 4. Actividades y citas
        supabase.from("project_activities").delete().eq("project_id", id),
        supabase.from("project_appointments").delete().eq("project_id", id),

        // 5. Contratos y licencias
        supabase.from("contracts").delete().eq("project_id", id),
        supabase.from("license_documents").delete().eq("project_id", id),

        // 6. Fotos de habitaciones
        supabase.from("room_photos").delete().eq("project_id", id),

        // 7. Marketplace (Solicitudes de leads)
        supabase.from("lead_requests").delete().eq("project_id", id),

      ]

      // Ejecutar todo en paralelo
      await Promise.all([...storageCleanup, ...dbCleanup])
      console.log(`[v0] Deep clean completado para el proyecto ${id}`)
    } catch (cleanError) {
      // No lanzamos error para no fallar la UX si el proyecto ya se borró, pero logueamos
      console.error("[v0] Error en limpieza profunda:", cleanError)
    }

    return true
  } catch (error) {
    console.error(`Error al eliminar el proyecto con ID ${id}:`, error)
    throw error
  }
}

/**
 * Duplica un proyecto completo con toda su configuración, planos y presupuestos
 */
export async function duplicateProject(projectId: string) {
  try {
    const supabase = await getSupabase()
    if (!supabase) throw new Error("Supabase client not available")

    // 1. Obtener proyecto original
    const { data: originalProject, error: fetchError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single()

    if (fetchError || !originalProject) {
      throw new Error(`Error al obtener el proyecto original: ${fetchError?.message || "No encontrado"}`)
    }

    // 2. Crear proyecto duplicado
    const newProjectId = uuidv4()
    const { id: _, created_at: __, ...projectToCopy } = originalProject

    const duplicatedProject = {
      ...projectToCopy,
      id: newProjectId,
      title: `${originalProject.title} (Copia)`,
      created_at: new Date().toISOString(),
      status: "Borrador",
      progress: 0
    }

    const { error: insertError } = await supabase.from("projects").insert(duplicatedProject)
    if (insertError) throw new Error(`Error al insertar el proyecto duplicado: ${insertError.message}`)

    // 3. Duplicar Datos de la Calculadora (calculator_data)
    const { data: calcData } = await supabase.from("calculator_data").select("*").eq("project_id", projectId).maybeSingle()
    if (calcData) {
      const { id: ___, project_id: ____, created_at: _____, updated_at: ______, ...calcToCopy } = calcData
      await supabase.from("calculator_data").insert({
        ...calcToCopy,
        project_id: newProjectId,
      })
    }

    // 4. Duplicar Ajustes de Derribos (demolition_settings)
    const { data: demoSettings } = await supabase.from("demolition_settings").select("*").eq("project_id", projectId).maybeSingle()
    if (demoSettings) {
      const { id: ___, project_id: ____, created_at: _____, updated_at: ______, ...demoToCopy } = demoSettings
      await supabase.from("demolition_settings").insert({
        ...demoToCopy,
        project_id: newProjectId,
      })
    }

    // 5. Duplicar Ajustes de Presupuesto (budget_settings)
    const { data: budgetSettings } = await supabase.from("budget_settings").select("*").eq("project_id", projectId).maybeSingle()
    if (budgetSettings) {
      const { project_id: ____, created_at: _____, updated_at: ______, ...settingsToCopy } = budgetSettings
      await supabase.from("budget_settings").insert({
        ...settingsToCopy,
        project_id: newProjectId,
      })
    }

    // 6. Duplicar Planos (project_floor_plans)
    const { data: floorPlans } = await supabase.from("project_floor_plans").select("*").eq("project_id", projectId)
    if (floorPlans && floorPlans.length > 0) {
      const plansToInsert = floorPlans.map((plan: any) => {
        const { id: ___, project_id: ____, created_at: _____, ...planToCopy } = plan
        return {
          ...planToCopy,
          project_id: newProjectId
        }
      })
      await supabase.from("project_floor_plans").insert(plansToInsert)
    }

    // 7. Duplicar Presupuestos y sus partidas
    const budgets = await BudgetService.getBudgetsByProject(projectId, supabase)
    for (const budget of budgets) {
      const fullBudget = await BudgetService.getBudgetById(budget.id, supabase)
      if (!fullBudget) continue

      const { id: oldBudgetId, project_id: _, created_at: __, updated_at: ___, line_items, ...budgetData } = fullBudget

      const { data: newBudget, error: bError } = await supabase
        .from("budgets")
        .insert({
          ...budgetData,
          project_id: newProjectId,
          status: "draft", // Siempre empezamos como borrador en la copia
        })
        .select()
        .single()

      if (bError) {
        console.error("Error duplicando presupuesto:", bError)
        continue
      }

      if (line_items && line_items.length > 0) {
        const lineItemsToInsert = line_items.map(item => {
          const { id: ____, budget_id: _____, created_at: ______, updated_at: _______, ...itemToCopy } = item
          return {
            ...itemToCopy,
            budget_id: newBudget.id
          }
        })
        await supabase.from("budget_line_items").insert(lineItemsToInsert)
      }

      // Duplicar Ajustes (budget_adjustments)
      const adjustments = await BudgetService.getBudgetAdjustments(oldBudgetId, supabase)
      if (adjustments && adjustments.length > 0) {
        const adjustmentsToInsert = adjustments.map(adj => {
          const { id: ____, budget_id: _____, created_at: ______, ...adjToCopy } = adj
          return {
            ...adjToCopy,
            budget_id: newBudget.id
          }
        })
        await supabase.from("budget_adjustments").insert(adjustmentsToInsert)
      }
    }

    return newProjectId
  } catch (error) {
    console.error("Error en duplicateProject:", error)
    throw error
  }
}

// Función para calcular el progreso basado en el estado
export function calculateProgress(status: string): number {
  if (!status) return 0
  const s = status.toLowerCase()
  switch (s) {
    case "borrador":
    case "draft":
      return 0
    case "entregado":
    case "sent":
    case "delivered":
      return 25
    case "aceptado":
    case "accepted":
    case "approved":
      return 50
    case "en obra":
    case "en_obra":
    case "in_progress":
    case "in progress":
      return 75
    case "finalizado":
    case "terminado":
    case "completed":
      return 100
    case "rechazado":
    case "rejected":
      return 0
    default:
      return 0
  }
}

// Funciones para gestionar actividades del proyecto
export async function createProjectActivity(activityData: ProjectActivityFormData) {
  try {
    const supabase = await getSupabase()

    if (!supabase) {
      throw new Error("Supabase client not available")
    }

    const { data: session } = await supabase.auth.getSession()
    if (!session.session) {
      throw new Error("No hay sesión activa")
    }

    const newActivity = {
      id: uuidv4(),
      project_id: activityData.project_id,
      description: activityData.description,
      date: activityData.date,
      type: activityData.type,
      user_id: session.session.user.id,
      created_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from("project_activities").insert(newActivity).select()

    if (error) {
      console.error("Error al insertar actividad:", error)
      throw error
    }

    return data[0] as ProjectActivity
  } catch (error) {
    console.error("Error al crear la actividad:", error)
    throw error
  }
}

export async function getProjectActivities(projectId: string) {
  try {
    const supabase = await getSupabase()

    if (!supabase) {
      console.error("[v0] getProjectActivities - Supabase client not available")
      return []
    }

    const { data, error } = await supabase
      .from("project_activities")
      .select("*")
      .eq("project_id", projectId)
      .order("date", { ascending: false })

    if (error) {
      // Si la tabla no existe, devolver un array vacío
      if (error.message.includes("does not exist")) {
        return []
      }
      console.error("Error al obtener actividades:", error)
      throw error
    }

    return data as ProjectActivity[]
  } catch (error) {
    console.error(`Error al obtener actividades del proyecto ${projectId}:`, error)
    return []
  }
}

export async function deleteProjectActivity(activityId: string) {
  try {
    const supabase = await getSupabase()

    if (!supabase) {
      throw new Error("Supabase client not available")
    }

    const { error } = await supabase.from("project_activities").delete().eq("id", activityId)

    if (error) {
      console.error("Error al eliminar actividad:", error)
      throw error
    }

    return true
  } catch (error) {
    console.error(`Error al eliminar la actividad ${activityId}:`, error)
    throw error
  }
}
