import { supabase } from "@/lib/supabase/client"

export async function createProjectsTableIfNotExists() {
  try {
    // Verificar si la tabla ya existe
    const { error: checkError } = await supabase.from("projects").select("id").limit(1)

    // Si no hay error, la tabla existe
    if (!checkError) {
      console.log("La tabla projects ya existe")
      return true
    }

    // Si el error no es porque la tabla no existe, algo más está mal
    if (!checkError.message.includes("does not exist")) {
      console.error("Error al verificar la tabla projects:", checkError)
      return false
    }

    // La tabla no existe, vamos a crearla
    console.log("Creando tabla projects...")

    // Ejecutar SQL para crear la tabla
    const { error: createError } = await supabase.rpc("create_projects_table")

    if (createError) {
      console.error("Error al crear la tabla projects:", createError)
      return false
    }

    console.log("Tabla projects creada correctamente")
    return true
  } catch (error) {
    console.error("Error inesperado al crear la tabla projects:", error)
    return false
  }
}

export async function addProjectAddressColumn() {
  try {
    // Verificar si la columna ya existe
    const { data, error: checkError } = await supabase.from("projects").select("projectAddress").limit(1).maybeSingle()

    // Si no hay error, la columna ya existe
    if (!checkError) {
      console.log("La columna projectAddress ya existe")
      return true
    }

    // Si el error no es porque la columna no existe, algo más está mal
    if (!checkError.message.includes("column") && !checkError.message.includes("does not exist")) {
      console.error("Error al verificar la columna projectAddress:", checkError)
      return false
    }

    console.log("Añadiendo columna projectAddress a la tabla projects...")

    // Ejecutar SQL para añadir la columna
    const { error: alterError } = await supabase.rpc("add_project_address_column")

    if (alterError) {
      console.error("Error al añadir la columna projectAddress:", alterError)
      return false
    }

    console.log("Columna projectAddress añadida correctamente")
    return true
  } catch (error) {
    console.error("Error inesperado al añadir la columna projectAddress:", error)
    return false
  }
}
