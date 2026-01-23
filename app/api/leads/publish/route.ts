export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { calculateLeadCreditsCost } from "@/types/marketplace"
import { newLeadAvailableTemplate } from "@/lib/email/templates/presmarket-emails"
import { sendEmail, ADMIN_EMAIL } from "@/lib/email/send-email"

async function logToDb(message: string, data: any = {}) {
  try {
    await supabaseAdmin.from("debug_logs").insert({ message, data })
  } catch (e) {
    console.error("Error logging to DB:", e)
  }
}

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

    const body = await req.json()
    const projectId = body.projectId
    const budgetId = body.budgetId
    const bodyEstimatedBudget = body.estimatedBudget
    const description = body.description
    const fullName = body.fullName?.trim()
    const reformStreet = body.reformStreet?.trim()
    const reformCity = body.reformCity?.trim()
    const reformProvince = body.reformProvince?.trim()
    const reformCountry = body.reformCountry?.trim()

    console.log("[v0] Request body - projectId:", projectId, "budgetId:", budgetId, "bodyEstimatedBudget:", bodyEstimatedBudget)
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
    let estimatedBudget = project.budget || bodyEstimatedBudget || 0

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

    // We only update the profile name if it was empty before, 
    // to avoid overwriting a full name with just a first name from the dialog
    if (fullName && (!profile.full_name || profile.full_name === "")) {
      console.log("[v0] Updating missing profile full_name to:", fullName)
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
      postal_code: project.reform_postal_code || project.postal_code || "00000", // Required field in DB
      city: reformCity,
      province: reformProvince,
      country_code: reformCountry === "España" ? "ES" : reformCountry,
      location_lat: null,
      location_lng: null,
      client_name: fullName,
      client_email: user.email || null,
      client_phone: profile.phone,
      max_companies: 3,
      companies_accessed_count: 0,
      companies_accessed_ids: [],
      lead_type: budgetId ? 'premium' : 'normal',
      expires_at: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    }

    console.log("[v0] Inserting lead request for user:", user.id)

    const { data: newLead, error: leadError } = await supabaseAdmin
      .from("lead_requests")
      .insert(leadRequest)
      .select()
      .single()

    if (leadError) {
      console.error("[v0] Error creating lead request:", leadError)
      return NextResponse.json(
        { error: leadError.message || "Error al crear solicitud de presupuestos" },
        { status: 500 },
      )
    }

    console.log("[v0] Lead request created successfully with ID:", newLead.id)
    await logToDb("Publish Lead Success In DB", { leadId: newLead.id, userId: user.id })

    try {
      // Email 1: To the homeowner
      const homeownerEmailResult = await sendEmail({
        to: user.email!,
        subject: "🔍 Estamos buscando profesionales para tu reforma",
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
                <p style="margin: 0; color: #92400e; font-weight: bold;">⚠️ Importante:</p>
                <p style="margin: 10px 0 0 0; color: #92400e;">
                  Tus datos de contacto serán compartidos con profesionales verificados de tu zona. 
                  <strong>Estate atento por si te llaman</strong> para ofrecerte sus servicios y presupuestos.
                </p>
              </div>
              
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 25px 0;">
                <h3 style="color: #374151; margin: 0 0 15px 0;">📋 Resumen de tu solicitud:</h3>
                <p style="margin: 8px 0; color: #4b5563;"><strong>Ubicación:</strong> ${reformStreet}, ${reformCity}, ${reformProvince}</p>
                <p style="margin: 8px 0; color: #4b5563;"><strong>Presupuesto estimado:</strong> ${estimatedBudget.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</p>
                <p style="margin: 8px 0; color: #4b5563;"><strong>Partidas incluidas:</strong> ${budgetSnapshot?.line_items?.length || 0}</p>
              </div>
              
              <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                Un saludo,<br>
                <strong>El equipo de Presupuéstalo</strong>
              </p>
            </div>
          </div>
        `,
      })
      await logToDb("Homeowner Email Sent", { result: homeownerEmailResult })

      // Email 2: To admin
      const adminEmailResult = await sendEmail({
        to: ADMIN_EMAIL,
        subject: `📌 Nueva solicitud de reforma en ${reformCity}, ${reformProvince}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #059669; padding: 20px; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Nueva Solicitud de Reforma</h1>
            </div>
            
            <div style="padding: 30px; background-color: #ffffff; border: 1px solid #e5e7eb; border-top: none;">
              <p style="font-size: 16px; color: #374151;">Se ha publicado una nueva solicitud en la plataforma.</p>
              
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 25px 0;">
                <h3 style="color: #374151; margin: 0 0 15px 0;">📋 Detalles:</h3>
                <p style="margin: 8px 0; color: #4b5563;"><strong>ID:</strong> ${newLead.id}</p>
                <p style="margin: 8px 0; color: #4b5563;"><strong>Cliente:</strong> ${fullName}</p>
                <p style="margin: 8px 0; color: #4b5563;"><strong>Email:</strong> ${user.email}</p>
                <p style="margin: 8px 0; color: #4b5563;"><strong>Teléfono:</strong> ${profile.phone}</p>
              </div>
              
              <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #059669;">
                <h3 style="color: #065f46; margin: 0 0 15px 0;">📍 Ubicación:</h3>
                <p style="margin: 8px 0; color: #065f46;"><strong>Dirección:</strong> ${reformStreet}</p>
                <p style="margin: 8px 0; color: #065f46;"><strong>Ciudad:</strong> ${reformCity}</p>
                <p style="margin: 8px 0; color: #065f46;"><strong>Provincia:</strong> ${reformProvince}</p>
              </div>
              
              <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 25px 0;">
                <h3 style="color: #92400e; margin: 0 0 15px 0;">💰 Economía:</h3>
                <p style="margin: 8px 0; color: #92400e;"><strong>Presupuesto:</strong> ${estimatedBudget.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</p>
                <p style="margin: 8px 0; color: #92400e;"><strong>Créditos:</strong> ${creditsCost}</p>
              </div>
            </div>
          </div>
        `,
      })
      await logToDb("Admin Email Sent", { result: adminEmailResult })

      // Email 3: To professionals in the province
      const currentCountry = reformCountry === "ES" ? "España" : (reformCountry === "Spain" ? "España" : reformCountry)
      await logToDb("Professional Search Started", { country: currentCountry, province: reformProvince })

      const { data: professionals, error: profsError } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, email, user_type, country, address_province, service_provinces")
        .eq("user_type", "professional")
        .eq("country", currentCountry)
        .not("email", "is", null)
        .or(`address_province.ilike.${reformProvince},service_provinces.cs.{${reformProvince}}`)

      if (profsError) {
        console.error("[v0] Error searching for professionals:", profsError)
        await logToDb("Professional Search Error", { error: profsError })
      }

      console.log("[v0] Professionals matched:", professionals?.length || 0)

      // Deduplicate by email
      const uniqueProfessionals = Array.from(new Map(
        (professionals || []).map(p => [p.email, p])
      ).values())

      await logToDb("Professionals Matched", {
        count: professionals?.length || 0,
        uniqueCount: uniqueProfessionals.length,
        emails: uniqueProfessionals.map(p => p.email)
      })

      if (uniqueProfessionals.length > 0) {
        const formattedBudget = estimatedBudget.toLocaleString("es-ES", { style: "currency", currency: "EUR" })

        const results = await Promise.allSettled(
          uniqueProfessionals.map(async (prof) => {
            if (!prof.email) return

            const profEmailHtml = newLeadAvailableTemplate({
              professionalName: prof.full_name || "Profesional",
              projectType: "Reforma Integral",
              city: reformCity,
              province: reformProvince,
              estimatedBudget: formattedBudget,
              creditsCost: creditsCost,
            })

            return sendEmail({
              to: prof.email,
              subject: `🚀 Nuevo proyecto en ${reformCity}: ${formattedBudget}`,
              html: profEmailHtml,
            })
          }),
        )
        await logToDb("Professional Emails Results", { results })
      }
    } catch (emailError) {
      console.error("[v0] Error sending notification emails:", emailError)
      await logToDb("General Email Error", { error: emailError instanceof Error ? emailError.message : String(emailError) })
    }

    return NextResponse.json({ success: true, leadRequest: newLead })
  } catch (error: any) {
    console.error("[v0] Error publishing lead:", error)
    await logToDb("Fatal Error in POST", { error: error.message, stack: error.stack })
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
  }
}
