export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { calculateLeadCreditsCost } from "@/types/marketplace"
import { newLeadAvailableTemplate } from "@/lib/email/templates/presmarket-emails"

export async function POST(req: Request) {
  try {
    console.log("[v0] POST /api/leads/publish - Starting")
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: "Configuración de servidor incompleta" }, { status: 500 })
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("[v0] Auth error:", authError)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    console.log("[v0] User authenticated:", user.id)

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("user_type, phone, phone_verified, full_name")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      console.error("[v0] Profile error:", profileError)
      return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 })
    }

    console.log("[v0] User type:", profile.user_type)

    if (!profile.phone || !profile.phone_verified) {
      console.error("[v0] Phone not verified. Phone:", profile.phone, "Verified:", profile.phone_verified)
      return NextResponse.json(
        {
          error: "Se requiere un número de teléfono verificado para publicar. Por favor verifica tu teléfono primero.",
        },
        { status: 400 },
      )
    }

    const { projectId, budgetId, description, fullName, reformStreet, reformCity, reformProvince, reformCountry } =
      await req.json()

    console.log("[v0] Request body - projectId:", projectId, "budgetId:", budgetId)
    console.log("[v0] Reform address:", { reformStreet, reformCity, reformProvince, reformCountry })
    console.log("[v0] Full name from request:", fullName)

    if (!projectId) {
      return NextResponse.json({ error: "ID de proyecto requerido" }, { status: 400 })
    }

    if (!fullName || !reformStreet || !reformCity || !reformProvince || !reformCountry) {
      return NextResponse.json({ error: "Nombre y dirección completa de la reforma son requeridos" }, { status: 400 })
    }

    console.log("[v0] Checking if lead_requests table exists...")
    const { error: tableCheckError } = await supabase.from("lead_requests").select("id").limit(1)

    if (tableCheckError) {
      console.error("[v0] Table check error:", tableCheckError)
      if (tableCheckError.message?.includes("relation") || tableCheckError.message?.includes("does not exist")) {
        return NextResponse.json(
          {
            error:
              "El sistema de marketplace no está configurado todavía. Por favor, ejecuta el script de inicialización primero: /api/setup-marketplace",
            needsSetup: true,
          },
          { status: 503 },
        )
      }
    }
    console.log("[v0] Table lead_requests exists")

    console.log("[v0] Checking for existing active requests for project:", projectId)
    const { data: existingRequests, error: checkError } = await supabase
      .from("lead_requests")
      .select("id, status, created_at, expires_at")
      .eq("project_id", projectId)
      .eq("homeowner_id", user.id)
      .in("status", ["open", "pending"])

    if (checkError) {
      console.error("[v0] Error checking existing requests:", checkError)
    } else if (existingRequests && existingRequests.length > 0) {
      const activeRequest = existingRequests[0]
      console.log("[v0] Found existing active request:", activeRequest.id)
      return NextResponse.json(
        {
          error: "Ya existe una solicitud activa para este proyecto",
          existingRequestId: activeRequest.id,
          message:
            "Solo puedes tener una solicitud activa por proyecto. Espera a que expire o cierra la solicitud actual antes de crear una nueva.",
        },
        { status: 409 },
      )
    }
    console.log("[v0] No active requests found, proceeding...")

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single()

    if (projectError || !project) {
      console.error("[v0] Project error:", projectError)
      return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 })
    }

    console.log("[v0] Project found:", project.id)

    let budgetSnapshot = null
    let estimatedBudget = project.budget || 0

    if (budgetId) {
      console.log("[v0] Fetching budget with ID:", budgetId)

      const { data: budget, error: budgetError } = await supabase
        .from("budgets")
        .select(`
          *,
          budget_line_items(*),
          budget_adjustments(*)
        `)
        .eq("id", budgetId)
        .single()

      if (budgetError) {
        console.error("[v0] Error fetching budget:", budgetError)
      }

      if (!budgetError && budget) {
        estimatedBudget = budget.total || 0

        console.log("[v0] Budget found. Total:", budget.total)
        console.log("[v0] Raw budget_line_items count:", budget.budget_line_items?.length || 0)

        if (budget.budget_line_items?.length > 0) {
          console.log("[v0] First 3 line items (raw):")
          budget.budget_line_items.slice(0, 3).forEach((item: any, idx: number) => {
            console.log(
              `[v0]   Item ${idx + 1}: ${item.description?.substring(0, 50)}... | qty: ${item.quantity} | unit: ${item.unit} | price: ${item.unit_price}`,
            )
          })
        }

        budgetSnapshot = {
          budget_id: budget.id,
          total: budget.total,
          subtotal: budget.subtotal,
          tax_amount: budget.tax_amount,
          tax_rate: budget.tax_rate,
          status: budget.status,
          created_at: budget.created_at,
          line_items:
            budget.budget_line_items?.map((item: any) => ({
              id: item.id,
              description: item.description,
              quantity: item.quantity,
              unit: item.unit,
              unit_price: item.unit_price,
              total: item.total,
              category: item.category,
              concept: item.concept || null,
              concept_code: item.concept_code || null,
              is_custom: item.is_custom || false,
              room_name: item.room_name,
              item_order: item.item_order,
            })) || [],
          adjustments:
            budget.budget_adjustments?.map((adj: any) => ({
              id: adj.id,
              type: adj.type,
              description: adj.description,
              amount: adj.amount,
              percentage: adj.percentage,
              created_at: adj.created_at,
            })) || [],
          metadata: {
            total_line_items: budget.budget_line_items?.length || 0,
            total_adjustments: budget.budget_adjustments?.length || 0,
            captured_at: new Date().toISOString(),
          },
        }

        console.log("[v0] Budget snapshot created with", budgetSnapshot.line_items.length, "line items")
        if (budgetSnapshot.line_items.length > 0) {
          console.log("[v0] First 3 snapshot items:")
          budgetSnapshot.line_items.slice(0, 3).forEach((item: any, idx: number) => {
            console.log(
              `[v0]   Item ${idx + 1}: ${item.description?.substring(0, 50)}... | qty: ${item.quantity} | unit: ${item.unit} | price: ${item.unit_price}`,
            )
          })
        }
      }
    }

    if (estimatedBudget === 0) {
      return NextResponse.json({ error: "El proyecto debe tener un presupuesto estimado" }, { status: 400 })
    }

    if (fullName && fullName !== profile.full_name) {
      console.log("[v0] Updating profile full_name from", profile.full_name, "to", fullName)
      const { error: updateError } = await supabase.from("profiles").update({ full_name: fullName }).eq("id", user.id)

      if (updateError) {
        console.error("[v0] Error updating profile:", updateError)
      } else {
        console.log("[v0] Profile name updated successfully")
      }
    }

    const reformTypes = ["reforma_integral"]
    const creditsCost = calculateLeadCreditsCost(estimatedBudget)
    console.log("[v0] Credits cost for budget", estimatedBudget, "is:", creditsCost)

    const leadRequest = {
      project_id: projectId,
      budget_id: budgetId || null,
      budget_snapshot: budgetSnapshot,
      homeowner_id: user.id,
      status: "open",
      estimated_budget: estimatedBudget,
      credits_cost: creditsCost,
      reform_types: reformTypes,
      project_description: description || project.description || null,
      reform_address: reformStreet,
      city: reformCity,
      province: reformProvince,
      country_code: reformCountry === "España" ? "ES" : reformCountry,
      location_lat: null,
      location_lng: null,
      client_name: fullName,
      client_email: user.email || null,
      client_phone: profile.phone,
      max_companies: 3, // Updated from 4 to 3
      companies_accessed_count: 0,
      companies_accessed_ids: [],
      expires_at: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    }

    console.log("[v0] Inserting lead request at:", leadRequest.created_at)
    console.log("[v0] Lead request object:", JSON.stringify(leadRequest, null, 2))

    const { data: newLead, error: leadError } = await supabase
      .from("lead_requests")
      .insert(leadRequest)
      .select()
      .single()

    if (leadError) {
      console.error("[v0] Error creating lead request:", leadError)
      console.error("[v0] Lead error details:", JSON.stringify(leadError, null, 2))
      return NextResponse.json(
        { error: leadError.message || "Error al crear solicitud de presupuestos" },
        { status: 500 },
      )
    }

    console.log("[v0] Lead request created successfully with ID:", newLead.id)

    try {
      // Email 1: To the homeowner confirming their request
      const homeownerEmailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Presupuéstalo <onboarding@resend.dev>",
          to: [user.email],
          subject: "ðŸ” Estamos buscando profesionales para tu reforma",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #f97316; padding: 20px; border-radius: 8px 8px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">¡Tu solicitud ha sido publicada!</h1>
              </div>
              
              <div style="padding: 30px; background-color: #ffffff; border: 1px solid #e5e7eb; border-top: none;">
                <p style="font-size: 16px; color: #374151;">Hola <strong>${fullName}</strong>,</p>
                
                <p style="font-size: 16px; color: #374151; line-height: 1.6;">
                  Hemos recibido tu solicitud de presupuesto y ya estamos en búsqueda de profesionales 
                  que puedan ayudarte con tu reforma.
                </p>
                
                <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #f59e0b;">
                  <p style="margin: 0; color: #92400e; font-weight: bold;">âš ï¸ Importante:</p>
                  <p style="margin: 10px 0 0 0; color: #92400e;">
                    Tus datos de contacto serán compartidos con profesionales verificados de tu zona. 
                    <strong>Estate atento porque pueden llamarte en cualquier momento</strong> para ofrecerte 
                    sus servicios y presupuestos.
                  </p>
                </div>
                
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 25px 0;">
                  <h3 style="color: #374151; margin: 0 0 15px 0;">ðŸ“‹ Resumen de tu solicitud:</h3>
                  <p style="margin: 8px 0; color: #4b5563;"><strong>Ubicación:</strong> ${reformStreet}, ${reformCity}, ${reformProvince}</p>
                  <p style="margin: 8px 0; color: #4b5563;"><strong>Presupuesto estimado:</strong> ${estimatedBudget.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</p>
                  <p style="margin: 8px 0; color: #4b5563;"><strong>Partidas incluidas:</strong> ${budgetSnapshot?.line_items?.length || 0}</p>
                </div>
                
                <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                  Si tienes alguna pregunta, no dudes en contactarnos.
                </p>
                
                <p style="font-size: 14px; color: #6b7280;">
                  Un saludo,<br>
                  <strong>El equipo de Presupuéstalo</strong>
                </p>
              </div>
              
              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 0 0 8px 8px; text-align: center;">
                <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                  © ${new Date().getFullYear()} Presupuéstalo. Todos los derechos reservados.
                </p>
              </div>
            </div>
          `,
        }),
      })

      if (!homeownerEmailResponse.ok) {
        const errorData = await homeownerEmailResponse.json()
        console.error("[v0] Error sending homeowner email:", errorData)
      } else {
        console.log("[v0] Homeowner confirmation email sent successfully")
      }

      // Email 2: To admin (presupuestaloficial@gmail.com) for tracking
      const adminEmailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Presupuéstalo <onboarding@resend.dev>",
          to: ["presupuestaloficial@gmail.com"],
          subject: `ðŸ“ Nueva solicitud de reforma en ${reformCity}, ${reformProvince}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #059669; padding: 20px; border-radius: 8px 8px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">Nueva Solicitud de Reforma</h1>
              </div>
              
              <div style="padding: 30px; background-color: #ffffff; border: 1px solid #e5e7eb; border-top: none;">
                <p style="font-size: 16px; color: #374151;">
                  Se ha publicado una nueva solicitud de presupuesto en la plataforma.
                </p>
                
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 25px 0;">
                  <h3 style="color: #374151; margin: 0 0 15px 0;">ðŸ“‹ Detalles de la solicitud:</h3>
                  <p style="margin: 8px 0; color: #4b5563;"><strong>ID:</strong> ${newLead.id}</p>
                  <p style="margin: 8px 0; color: #4b5563;"><strong>Cliente:</strong> ${fullName}</p>
                  <p style="margin: 8px 0; color: #4b5563;"><strong>Email:</strong> ${user.email}</p>
                  <p style="margin: 8px 0; color: #4b5563;"><strong>Teléfono:</strong> ${profile.phone}</p>
                </div>
                
                <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #059669;">
                  <h3 style="color: #065f46; margin: 0 0 15px 0;">ðŸ“ Ubicación de la reforma:</h3>
                  <p style="margin: 8px 0; color: #065f46;"><strong>Dirección:</strong> ${reformStreet}</p>
                  <p style="margin: 8px 0; color: #065f46;"><strong>Ciudad:</strong> ${reformCity}</p>
                  <p style="margin: 8px 0; color: #065f46;"><strong>Provincia:</strong> ${reformProvince}</p>
                </div>
                
                <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 25px 0;">
                  <h3 style="color: #92400e; margin: 0 0 15px 0;">💰 Información económica:</h3>
                  <p style="margin: 8px 0; color: #92400e;"><strong>Presupuesto estimado:</strong> ${estimatedBudget.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</p>
                  <p style="margin: 8px 0; color: #92400e;"><strong>Partidas incluidas:</strong> ${budgetSnapshot?.line_items?.length || 0}</p>
                  <p style="margin: 8px 0; color: #92400e;"><strong>Créditos:</strong> ${creditsCost}</p>
                </div>
                
                <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                  <strong>Fecha:</strong> ${new Date().toLocaleString("es-ES", { dateStyle: "full", timeStyle: "short" })}
                </p>
              </div>
              
              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 0 0 8px 8px; text-align: center;">
                <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                  Email automático de notificación - Presupuéstalo
                </p>
              </div>
            </div>
          `,
        }),
      })

      if (!adminEmailResponse.ok) {
        const errorData = await adminEmailResponse.json()
        console.error("[v0] Error sending admin email:", errorData)
      } else {
        console.log("[v0] Admin notification email sent successfully")
      }

      // Email 3: To all professionals in the same province
      if (reformProvince) {
        console.log("[v0] Identifying professionals in province:", reformProvince)

        // Find professionals in this province
        const { data: professionals, error: profError } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .eq("user_type", "profesional")
          .eq("address_province", reformProvince)
          .not("email", "is", null)

        if (profError) {
          console.error("[v0] Error fetching professionals for notification:", profError)
        } else if (professionals && professionals.length > 0) {
          console.log(`[v0] Found ${professionals.length} professionals in ${reformProvince}. Sending emails...`)

          const formattedBudget = estimatedBudget.toLocaleString("es-ES", { style: "currency", currency: "EUR" })

          // Send emails in parallel (using Promise.allSettled to not fail if one fails)
          await Promise.allSettled(
            professionals.map(async (prof) => {
              if (!prof.email) return

              const profEmailHtml = newLeadAvailableTemplate({
                professionalName: prof.full_name || "Profesional",
                projectType: "Reforma Integral", // Default for now as per reformTypes array above
                city: reformCity,
                province: reformProvince,
                estimatedBudget: formattedBudget,
                creditsCost: creditsCost
              })

              console.log(`[v0] Enviando email a profesional: ${prof.email}`)
              return fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                },
                body: JSON.stringify({
                  from: "Presupuéstalo <onboarding@resend.dev>",
                  to: [prof.email],
                  subject: `Nuevo proyecto en ${reformCity}: ${formattedBudget}`,
                  html: profEmailHtml,
                }),
              })
            })
          )
          console.log("[v0] Province notifications sent")
        } else {
          console.log("[v0] No professionals found in this province to notify")
        }
      }
    } catch (emailError) {
      // Don't fail the request if emails fail, just log the error
      console.error("[v0] Error sending notification emails:", emailError)
    }

    return NextResponse.json({ success: true, leadRequest: newLead })
  } catch (error: any) {
    console.error("[v0] Error publishing lead:", error)
    console.error("[v0] Error stack:", error.stack)
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
  }
}

