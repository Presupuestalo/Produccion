export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const supabase = await createClient()

    if (!supabase) {
      return NextResponse.json({ error: "Configuración de servidor incompleta" }, { status: 500 })
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("user_type")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 })
    }

    if (profile.user_type === "homeowner") {
      return NextResponse.json(
        { error: "Solo empresas pueden importar presupuestos" },
        { status: 403 }
      )
    }

    const { leadRequestId } = await req.json()

    if (!leadRequestId) {
      return NextResponse.json({ error: "ID de lead requerido" }, { status: 400 })
    }

    // Verificar que la empresa tiene acceso al lead
    const { data: interaction, error: interactionError } = await supabase
      .from("lead_interactions")
      .select("*")
      .eq("lead_request_id", leadRequestId)
      .eq("company_id", user.id)
      .eq("action", "accessed")
      .single()

    if (interactionError || !interaction) {
      return NextResponse.json(
        { error: "No tienes acceso a este lead" },
        { status: 403 }
      )
    }

    // Obtener el lead y el proyecto
    const { data: leadRequest, error: leadError } = await supabase
      .from("lead_requests")
      .select("project_id, homeowner_id, client_name, client_email, client_phone")
      .eq("id", leadRequestId)
      .single()

    if (leadError || !leadRequest) {
      return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 })
    }

    // Obtener el proyecto original del propietario
    const { data: originalProject, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", leadRequest.project_id)
      .single()

    if (projectError || !originalProject) {
      return NextResponse.json({ error: "Proyecto original no encontrado" }, { status: 404 })
    }

    // Crear copia del proyecto para la empresa
    const newProject = {
      user_id: user.id,
      name: `[LEAD] ${originalProject.name || "Proyecto importado"}`,
      description: `Proyecto importado de lead #${leadRequestId}\n\n${originalProject.description || ""}`,
      client: leadRequest.client_name || originalProject.client,
      client_email: leadRequest.client_email || originalProject.client_email,
      client_phone: leadRequest.client_phone || originalProject.client_phone,
      client_address: originalProject.client_address,
      street: originalProject.street,
      project_floor: originalProject.project_floor,
      door: originalProject.door,
      city: originalProject.city,
      province: originalProject.province,
      postal_code: originalProject.postal_code,
      country_code: originalProject.country_code,
      has_elevator: originalProject.has_elevator,
      structure: originalProject.structure,
      ceiling_height: originalProject.ceiling_height,
      budget: originalProject.budget,
      status: "draft",
      created_from_lead: leadRequestId,
    }

    const { data: importedProject, error: importError } = await supabase
      .from("projects")
      .insert(newProject)
      .select()
      .single()

    if (importError) {
      console.error("[v0] Error importing project:", importError)
      return NextResponse.json({ error: "Error al importar proyecto" }, { status: 500 })
    }

    // Copiar datos de la calculadora si existen
    const { data: originalCalculator, error: calcError } = await supabase
      .from("calculator_data")
      .select("*")
      .eq("project_id", leadRequest.project_id)
      .single()

    if (originalCalculator && !calcError) {
      const { data: importedCalculator, error: importCalcError } = await supabase
        .from("calculator_data")
        .insert({
          project_id: importedProject.id,
          user_id: user.id,
          reform: originalCalculator.reform,
          partitions: originalCalculator.partitions,
          wallLinings: originalCalculator.wallLinings,
        })
        .select()
        .single()

      if (importCalcError) {
        console.error("[v0] Error importing calculator data:", importCalcError)
      }
    }

    console.log("[v0] Project imported successfully:", importedProject.id)

    return NextResponse.json({
      success: true,
      projectId: importedProject.id,
      message: "Presupuesto importado correctamente"
    })
  } catch (error: any) {
    console.error("[v0] Error importing budget:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

