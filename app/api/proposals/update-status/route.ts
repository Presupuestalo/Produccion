import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: Request) {
  console.log("[v0] =====================================")
  console.log("[v0] API update-status INICIADO")
  console.log("[v0] =====================================")

  try {
    const body = await request.json()
    console.log("[v0] Body recibido:", JSON.stringify(body))

    const { proposalId, action } = body

    if (!proposalId || !action || !["accepted", "rejected"].includes(action)) {
      console.log("[v0] ERROR: Params inválidos:", { proposalId, action })
      return NextResponse.json({ error: "proposalId y action (accepted/rejected) son requeridos" }, { status: 400 })
    }

    // Get proposal details
    console.log("[v0] Buscando propuesta:", proposalId)

    const { data: proposal, error: proposalError } = await supabaseAdmin
      .from("professional_proposals")
      .select(`
        *,
        lead_requests (*)
      `)
      .eq("id", proposalId)
      .single()

    if (proposalError) {
      console.error("[v0] ERROR obteniendo propuesta:", proposalError)
      return NextResponse.json({ error: "Error al obtener propuesta: " + proposalError.message }, { status: 500 })
    }

    if (!proposal) {
      console.log("[v0] ERROR: Propuesta no encontrada")
      return NextResponse.json({ error: "Propuesta no encontrada" }, { status: 404 })
    }

    console.log("[v0] Propuesta encontrada:", {
      id: proposal.id,
      professional_id: proposal.professional_id,
      lead_request_id: proposal.lead_request_id,
      current_status: proposal.status,
    })

    const leadRequest = proposal.lead_requests

    if (!leadRequest) {
      console.error("[v0] ERROR: Lead request no encontrado para propuesta")
      return NextResponse.json({ error: "Lead request no encontrado" }, { status: 404 })
    }

    console.log("[v0] Lead request:", {
      id: leadRequest.id,
      project_id: leadRequest.project_id,
      budget_id: leadRequest.budget_id,
      homeowner_id: leadRequest.homeowner_id,
    })

    // Update proposal status
    console.log("[v0] Actualizando estado de propuesta a:", action)

    const { error: updateError } = await supabaseAdmin
      .from("professional_proposals")
      .update({
        status: action,
        updated_at: new Date().toISOString(),
      })
      .eq("id", proposalId)

    if (updateError) {
      console.error("[v0] ERROR actualizando propuesta:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    console.log("[v0] Estado de propuesta actualizado correctamente")

    // Get professional info for email
    const { data: professional } = await supabaseAdmin
      .from("profiles")
      .select("full_name, company_name, email, phone")
      .eq("id", proposal.professional_id)
      .single()

    console.log("[v0] Info del profesional:", professional)

    const resendApiKey = process.env.RESEND_API_KEY
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://presupuestalo.com"
    let newProjectId: string | null = null
    let projectCreationError: string | null = null

    if (action === "accepted") {
      console.log("[v0] =====================================")
      console.log("[v0] PROCESANDO ACEPTACIÓN")
      console.log("[v0] =====================================")

      // Reject other proposals
      console.log("[v0] Rechazando otras propuestas...")
      const { data: otherProposals, error: fetchOthersError } = await supabaseAdmin
        .from("professional_proposals")
        .select("id, professional_id")
        .eq("lead_request_id", proposal.lead_request_id)
        .neq("id", proposalId)
        .eq("status", "pending")

      if (fetchOthersError) {
        console.error("[v0] Error obteniendo otras propuestas:", fetchOthersError)
      } else if (otherProposals && otherProposals.length > 0) {
        console.log("[v0] Encontradas", otherProposals.length, "otras propuestas para rechazar")

        const { error: rejectError } = await supabaseAdmin
          .from("professional_proposals")
          .update({
            status: "rejected",
            updated_at: new Date().toISOString(),
          })
          .eq("lead_request_id", proposal.lead_request_id)
          .neq("id", proposalId)
          .eq("status", "pending")

        if (rejectError) {
          console.error("[v0] Error rechazando otras propuestas:", rejectError)
        } else {
          console.log("[v0] Otras propuestas rechazadas correctamente")
        }
      }

      // Close lead_request
      console.log("[v0] Cerrando lead_request...")
      const { error: leadUpdateError } = await supabaseAdmin
        .from("lead_requests")
        .update({
          status: "closed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", proposal.lead_request_id)

      if (leadUpdateError) {
        console.error("[v0] Error cerrando lead_request:", leadUpdateError)
      }

      // ========================================
      // CREACIÓN DEL PROYECTO PARA EL PROFESIONAL
      // ========================================
      console.log("[v0] =====================================")
      console.log("[v0] CREANDO PROYECTO PARA EL PROFESIONAL")
      console.log("[v0] Professional ID:", proposal.professional_id)
      console.log("[v0] =====================================")

      // Get original project
      let originalProject = null
      if (leadRequest.project_id) {
        console.log("[v0] Obteniendo proyecto original:", leadRequest.project_id)
        const { data: project, error: projectFetchError } = await supabaseAdmin
          .from("projects")
          .select("*")
          .eq("id", leadRequest.project_id)
          .single()

        if (projectFetchError) {
          console.error("[v0] ERROR obteniendo proyecto original:", projectFetchError)
        } else {
          originalProject = project
          console.log("[v0] Proyecto original encontrado:", originalProject?.title)
        }
      } else {
        console.log("[v0] No hay project_id en lead_request, creando proyecto desde cero")
      }

      // Get original budget with line items
      let originalBudget = null
      let originalLineItems: any[] = []
      if (leadRequest.budget_id) {
        console.log("[v0] Obteniendo presupuesto original:", leadRequest.budget_id)
        const { data: budget, error: budgetFetchError } = await supabaseAdmin
          .from("budgets")
          .select("*")
          .eq("id", leadRequest.budget_id)
          .single()

        if (budgetFetchError) {
          console.error("[v0] ERROR obteniendo presupuesto original:", budgetFetchError)
        } else {
          originalBudget = budget
          console.log("[v0] Presupuesto original encontrado:", originalBudget?.title, "Total:", originalBudget?.total)

          const { data: items, error: itemsError } = await supabaseAdmin
            .from("budget_line_items")
            .select("*")
            .eq("budget_id", leadRequest.budget_id)
            .order("item_order", { ascending: true })

          if (itemsError) {
            console.error("[v0] ERROR obteniendo line items:", itemsError)
          } else {
            originalLineItems = items || []
            console.log("[v0] Encontrados", originalLineItems.length, "line items")
          }
        }
      }

      // Crear datos del proyecto
      const projectData: Record<string, any> = {
        user_id: proposal.professional_id,
        title: originalProject?.title || `Reforma - ${leadRequest.city || "Cliente"}`,
        description:
          originalProject?.description ||
          `Proyecto del marketplace\n\nCliente: ${leadRequest.client_name || "No especificado"}\nTeléfono: ${leadRequest.client_phone || "No especificado"}`,
        status: "Borrador",
        progress: 0,
        color: originalProject?.color || "#ea580c",
        created_at: new Date().toISOString(),
        city: leadRequest.city || originalProject?.city || null,
        province: leadRequest.province || originalProject?.province || null,
        client_name: leadRequest.client_name || originalProject?.client_name || null,
        client_phone: leadRequest.client_phone || originalProject?.client_phone || null,
        client_email: leadRequest.client_email || originalProject?.client_email || null,
      }

      // Copy SAFE fields from original project
      if (originalProject) {
        const safeFieldsToPreserve = [
          "floor_area",
          "num_rooms",
          "num_bathrooms",
          "property_type",
          "reform_type",
          "has_demolition",
          "has_electricity",
          "has_plumbing",
          "has_heating",
          "has_ac",
          "has_floors",
          "has_walls",
          "has_ceilings",
          "has_carpentry",
          "has_painting",
          "has_kitchen",
          "has_bathroom",
          "notes",
        ]
        safeFieldsToPreserve.forEach((field) => {
          if (originalProject[field] !== undefined && originalProject[field] !== null) {
            projectData[field] = originalProject[field]
          }
        })
      }

      console.log("[v0] Datos del proyecto a crear:", JSON.stringify(projectData, null, 2))

      // INSERTAR PROYECTO
      const { data: newProject, error: projectError } = await supabaseAdmin
        .from("projects")
        .insert(projectData)
        .select()
        .single()

      if (projectError) {
        console.error("[v0] ❌ ERROR CREANDO PROYECTO:", projectError)
        projectCreationError = projectError.message
      } else if (!newProject) {
        console.error("[v0] ❌ PROYECTO CREADO PERO NO SE DEVOLVIERON DATOS")
        projectCreationError = "Proyecto creado pero no se devolvieron datos"
      } else {
        console.log("[v0] ✅ PROYECTO CREADO EXITOSAMENTE:", newProject.id)
        newProjectId = newProject.id

        // Verificar que el proyecto existe
        const { data: verifyProject, error: verifyError } = await supabaseAdmin
          .from("projects")
          .select("id, user_id, title")
          .eq("id", newProject.id)
          .single()

        if (verifyError || !verifyProject) {
          console.error("[v0] ❌ VERIFICACIÓN DEL PROYECTO FALLÓ:", verifyError)
        } else {
          console.log("[v0] ✅ PROYECTO VERIFICADO:", verifyProject)
        }

        // Crear presupuesto
        console.log("[v0] Creando presupuesto para proyecto:", newProject.id)

        const budgetData: Record<string, any> = {
          user_id: proposal.professional_id,
          project_id: newProject.id,
          title: originalBudget?.title || newProject.title,
          status: "draft",
          subtotal: originalBudget?.subtotal || proposal.proposed_budget || 0,
          tax_rate: originalBudget?.tax_rate || 0.21,
          tax_amount: originalBudget?.tax_amount || (proposal.proposed_budget || 0) * 0.21,
          total: originalBudget?.total || (proposal.proposed_budget || 0) * 1.21,
          notes: `Cliente: ${leadRequest.client_name || "N/A"}\nTeléfono: ${leadRequest.client_phone || "N/A"}\nUbicación: ${leadRequest.city || ""}${leadRequest.province ? `, ${leadRequest.province}` : ""}\n\n${originalBudget?.notes || "Presupuesto aceptado por el cliente."}`,
          created_at: new Date().toISOString(),
        }

        if (originalBudget) {
          const budgetFields = [
            "version",
            "valid_until",
            "payment_terms",
            "warranty_terms",
            "margin_percentage",
            "discount_percentage",
            "discount_amount",
          ]
          budgetFields.forEach((field) => {
            if (originalBudget[field] !== undefined && originalBudget[field] !== null) {
              budgetData[field] = originalBudget[field]
            }
          })
        }

        const { data: newBudget, error: budgetError } = await supabaseAdmin
          .from("budgets")
          .insert(budgetData)
          .select()
          .single()

        if (budgetError) {
          console.error("[v0] ❌ Error creando presupuesto:", budgetError)
        } else {
          console.log("[v0] ✅ Presupuesto creado:", newBudget.id)

          // Copy line items
          if (originalLineItems.length > 0) {
            console.log("[v0] Copiando", originalLineItems.length, "line items...")

            const newLineItems = originalLineItems.map((item, index) => ({
              budget_id: newBudget.id,
              description: item.description,
              quantity: item.quantity,
              unit: item.unit,
              unit_price: item.unit_price,
              total: item.total,
              category: item.category,
              room_name: item.room_name,
              item_order: item.item_order ?? index,
              concept_code: item.concept_code,
              subcategory: item.subcategory,
              notes: item.notes,
            }))

            const { error: itemsInsertError } = await supabaseAdmin.from("budget_line_items").insert(newLineItems)

            if (itemsInsertError) {
              console.error("[v0] Error copiando line items:", itemsInsertError)
            } else {
              console.log("[v0] ✅ Line items copiados correctamente")
            }
          } else if (
            proposal.proposed_items &&
            Array.isArray(proposal.proposed_items) &&
            proposal.proposed_items.length > 0
          ) {
            console.log("[v0] Usando proposed_items:", proposal.proposed_items.length)

            const lineItems = proposal.proposed_items.map((item: any, index: number) => ({
              budget_id: newBudget.id,
              description: item.description || "Partida",
              quantity: item.quantity || 1,
              unit: item.unit || "ud",
              unit_price: item.unit_price || 0,
              total: item.total || 0,
              category: item.category || "general",
              room_name: item.room_name || null,
              item_order: index,
            }))

            const { error: itemsError } = await supabaseAdmin.from("budget_line_items").insert(lineItems)

            if (itemsError) {
              console.error("[v0] Error creando line items:", itemsError)
            } else {
              console.log("[v0] ✅ Line items de propuesta creados")
            }
          }
        }
      }

      // Send acceptance email to professional
      if (resendApiKey && professional?.email) {
        console.log("[v0] Enviando email de aceptación a:", professional.email)

        try {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "Presupuéstalo <notificaciones@presupuestalo.com>",
              to: [professional.email],
              subject: "🎉 ¡Tu propuesta ha sido aceptada!",
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1>🎉 ¡Tu propuesta ha sido aceptada!</h1>
                  </div>
                  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
                    <p>Hola ${professional.company_name || professional.full_name || "Profesional"},</p>
                    <p>¡Excelentes noticias! El cliente ha aceptado tu propuesta de presupuesto.</p>
                    <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
                      <strong>Detalles del proyecto:</strong><br>
                      📍 <strong>Ubicación:</strong> ${leadRequest.city || "No especificada"}${leadRequest.province ? `, ${leadRequest.province}` : ""}<br>
                      💰 <strong>Tu presupuesto:</strong> ${(proposal.proposed_budget || 0).toLocaleString("es-ES", { style: "currency", currency: "EUR" })}<br>
                      👤 <strong>Cliente:</strong> ${leadRequest.client_name || "No especificado"}<br>
                      📞 <strong>Teléfono:</strong> ${leadRequest.client_phone || "No especificado"}
                    </div>
                    <p><strong>El proyecto completo ya está disponible en tu panel de proyectos</strong>, con todas las partidas y detalles del presupuesto original.</p>
                    <a href="${siteUrl}/dashboard/projects${newProjectId ? `/${newProjectId}` : ""}" style="display: inline-block; background: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">Ver Proyecto</a>
                  </div>
                </div>
              `,
            }),
          })
          console.log("[v0] ✅ Email de aceptación enviado")
        } catch (emailError) {
          console.error("[v0] Error enviando email de aceptación:", emailError)
        }
      }
    } else if (action === "rejected") {
      // Send rejection email
      if (resendApiKey && professional?.email) {
        try {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "Presupuéstalo <notificaciones@presupuestalo.com>",
              to: [professional.email],
              subject: "Actualización sobre tu propuesta",
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1>Propuesta no seleccionada</h1>
                  </div>
                  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
                    <p>Hola ${professional.company_name || professional.full_name || "Profesional"},</p>
                    <p>El cliente ha decidido no continuar con tu propuesta para el proyecto en ${leadRequest.city || "la ubicación solicitada"}.</p>
                    <p>¡No te desanimes! Hay más oportunidades esperándote en el marketplace.</p>
                    <a href="${siteUrl}/dashboard/solicitudes-disponibles" style="display: inline-block; background: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">Ver más oportunidades</a>
                  </div>
                </div>
              `,
            }),
          })
          console.log("[v0] ✅ Email de rechazo enviado")
        } catch (emailError) {
          console.error("[v0] Error enviando email de rechazo:", emailError)
        }
      }
    }

    console.log("[v0] =====================================")
    console.log("[v0] RESPUESTA FINAL")
    console.log("[v0] newProjectId:", newProjectId)
    console.log("[v0] projectCreationError:", projectCreationError)
    console.log("[v0] =====================================")

    return NextResponse.json({
      success: true,
      message: action === "accepted" ? "Propuesta aceptada correctamente" : "Propuesta rechazada correctamente",
      projectId: newProjectId,
      warnings: projectCreationError ? [`Error creando proyecto: ${projectCreationError}`] : undefined,
    })
  } catch (error: any) {
    console.error("[v0] ERROR GENERAL:", error)
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
  }
}
