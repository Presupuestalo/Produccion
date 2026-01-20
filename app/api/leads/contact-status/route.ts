import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// POST - Actualizar el estado de contacto de un lead
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const { leadInteractionId, status, contactMethod } = body

    // Validar campos requeridos
    if (!leadInteractionId || !status) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    // Validar estado
    const validStatuses = ["contacted", "negotiating", "won", "lost"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Estado no válido" }, { status: 400 })
    }

    // Verificar que la interacción existe y pertenece al usuario
    const { data: interaction, error: interactionError } = await supabase
      .from("lead_interactions")
      .select("*")
      .eq("id", leadInteractionId)
      .eq("company_id", user.id)
      .single()

    if (interactionError || !interaction) {
      return NextResponse.json({ error: "Interacción no encontrada" }, { status: 404 })
    }

    // Actualizar el estado
    const updateData: any = {
      outcome: status,
    }

    if (status === "contacted") {
      updateData.contact_confirmed_at = new Date().toISOString()
      updateData.contact_attempts = (interaction.contact_attempts || 0) + 1
      updateData.last_contact_attempt_at = new Date().toISOString()
    }

    const { error: updateError } = await supabase
      .from("lead_interactions")
      .update(updateData)
      .eq("id", leadInteractionId)

    if (updateError) {
      console.error("[v0] Error actualizando estado:", updateError)
      return NextResponse.json({ error: "Error al actualizar el estado" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Estado actualizado correctamente",
    })
  } catch (error: any) {
    console.error("[v0] Error en POST /api/leads/contact-status:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
