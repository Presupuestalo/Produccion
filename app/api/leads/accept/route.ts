import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { Resend } from "resend"

export const dynamic = "force-dynamic"
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    console.log("[v0] POST /api/leads/accept - Starting")
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: "Fallo al inicializar Supabase" }, { status: 500 })
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("[v0] Auth error:", authError)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { leadId, creditsCost } = await req.json()
    const professionalId = user.id
    console.log("[v0] Professional", professionalId, "accepting lead", leadId, "creditsCost:", creditsCost)

    if (!leadId) {
      return NextResponse.json({ error: "leadId requerido" }, { status: 400 })
    }

    const { data: lead, error: leadError } = await supabaseAdmin
      .from("lead_requests")
      .select("*")
      .eq("id", leadId)
      .single()

    if (leadError || !lead) {
      console.error("[v0] Lead not found:", leadError)
      return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 })
    }

    console.log("[v0] Lead found:", lead.id, "Budget snapshot:", !!lead.budget_snapshot)

    const alreadyAccessed = lead.companies_accessed_ids?.includes(professionalId)

    if (alreadyAccessed) {
      console.log("[v0] Professional already accessed this lead")
      return NextResponse.json({
        success: true,
        alreadyAccessed: true,
        message: "Ya tienes acceso a este lead",
        lead: {
          client_name: lead.client_name,
          client_email: lead.client_email,
          client_phone: lead.client_phone,
          city: lead.city,
          province: lead.province,
          budget_snapshot: lead.budget_snapshot,
        },
      })
    }

    const { data: professionalProfile } = await supabaseAdmin
      .from("profiles")
      .select("company_name, full_name, email, phone")
      .eq("id", professionalId)
      .single()

    const companyName = professionalProfile?.company_name || professionalProfile?.full_name || "Una empresa"

    const creditsToCharge = creditsCost || 100
    console.log("[v0] Credits to charge:", creditsToCharge)

    const { data: creditsData, error: creditsError } = await supabaseAdmin
      .from("company_credits")
      .select("credits_balance, credits_spent_total")
      .eq("company_id", professionalId)
      .single()

    if (creditsError) {
      console.error("[v0] Error fetching credits:", creditsError)
      if (creditsError.code === "PGRST116") {
        return NextResponse.json(
          { error: "No tienes cuenta de créditos. Por favor, compra créditos primero." },
          { status: 400 },
        )
      }
      return NextResponse.json({ error: "Error al verificar créditos: " + creditsError.message }, { status: 500 })
    }

    const currentBalance = creditsData?.credits_balance || 0
    console.log("[v0] Current credits balance:", currentBalance)

    if (currentBalance < creditsToCharge) {
      return NextResponse.json(
        { error: `Créditos insuficientes. Tienes ${currentBalance} créditos y necesitas ${creditsToCharge}.` },
        { status: 400 },
      )
    }

    const newBalance = currentBalance - creditsToCharge
    const { error: updateCreditsError } = await supabaseAdmin
      .from("company_credits")
      .update({
        credits_balance: newBalance,
        credits_spent_total: (creditsData?.credits_spent_total || 0) + creditsToCharge,
        updated_at: new Date().toISOString(),
      })
      .eq("company_id", professionalId)

    if (updateCreditsError) {
      console.error("[v0] Error updating credits:", updateCreditsError)
      return NextResponse.json({ error: "Error al descontar créditos" }, { status: 500 })
    }

    console.log("[v0] Credits deducted. New balance:", newBalance)

    const { error: transactionError } = await supabaseAdmin.from("credit_transactions").insert({
      company_id: professionalId,
      amount: -creditsToCharge,
      type: "spent",
      description: `Acceso a lead en ${lead.city || "Sin ubicación"} - ${lead.reform_types?.join(", ") || "Reforma"}`,
      lead_request_id: leadId,
      created_at: new Date().toISOString(),
    })

    if (transactionError) {
      console.error("[v0] Error creating transaction:", transactionError)
    }

    const { error: interactionError } = await supabaseAdmin.from("lead_interactions").insert({
      lead_request_id: leadId,
      company_id: professionalId,
      action: "accessed",
      accessed_at: new Date().toISOString(),
    })

    if (interactionError) {
      console.error("[v0] Error creating interaction:", interactionError)
    }

    const updatedAccessedIds = [...(lead.companies_accessed_ids || []), professionalId]
    const newCount = (lead.companies_accessed_count || 0) + 1

    const { error: updateError } = await supabaseAdmin
      .from("lead_requests")
      .update({
        companies_accessed_count: newCount,
        companies_accessed_ids: updatedAccessedIds,
      })
      .eq("id", leadId)

    if (updateError) {
      console.error("[v0] Error updating companies_accessed_count:", updateError)
    }

    if (lead.client_email) {
      try {
        console.log("[v0] Sending notification email to homeowner:", lead.client_email)

        const reformType = lead.reform_types?.join(", ") || "Reforma"
        const location = lead.city ? `${lead.city}${lead.province ? `, ${lead.province}` : ""}` : "tu zona"

        await resend.emails.send({
          from: "Presupuéstalo <notificaciones@presupuestalo.com>",
          to: lead.client_email,
          subject: `🏗️ ${companyName} se ha interesado en tu proyecto`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #E07B38 0%, #C96A2D 100%); padding: 30px 40px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
                    ¡Buenas noticias!
                  </h1>
                </div>
                
                <!-- Content -->
                <div style="padding: 40px;">
                  <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Hola${lead.client_name ? ` ${lead.client_name}` : ""},
                  </p>
                  
                  <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    <strong style="color: #E07B38;">${companyName}</strong> ha mostrado interés en tu proyecto de <strong>${reformType}</strong> en ${location}.
                  </p>
                  
                  <div style="background-color: #FFF8F3; border-left: 4px solid #E07B38; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                    <p style="color: #333; font-size: 15px; margin: 0; line-height: 1.6;">
                      Esta empresa ha accedido a los datos de tu solicitud y podrá contactarte directamente o enviarte una propuesta detallada.
                    </p>
                  </div>
                  
                  <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
                    Puedes ver todas las empresas interesadas y sus propuestas en tu panel de control:
                  </p>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://presupuestalo.com"}/dashboard/mis-solicitudes" 
                       style="display: inline-block; background: linear-gradient(135deg, #E07B38 0%, #C96A2D 100%); color: #ffffff; text-decoration: none; padding: 14px 35px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      Ver mis solicitudes
                    </a>
                  </div>
                  
                  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-top: 30px;">
                    <p style="color: #666; font-size: 14px; margin: 0; line-height: 1.6;">
                      <strong>💡 Consejo:</strong> Compara las propuestas que recibas y no dudes en contactar directamente con las empresas para resolver cualquier duda antes de decidirte.
                    </p>
                  </div>
                </div>
                
                <!-- Footer -->
                <div style="background-color: #2D3748; padding: 25px 40px; text-align: center;">
                  <p style="color: #A0AEC0; font-size: 12px; margin: 0; line-height: 1.6;">
                    Este email fue enviado por Presupuéstalo<br>
                    © ${new Date().getFullYear()} Presupuéstalo. Todos los derechos reservados.
                  </p>
                </div>
              </div>
            </body>
            </html>
          `,
        })

        console.log("[v0] Notification email sent successfully to homeowner")
      } catch (emailError) {
        console.error("[v0] Error sending notification email:", emailError)
        // No fail the request if email fails
      }
    }

    console.log("[v0] Lead access granted successfully")

    return NextResponse.json({
      success: true,
      message: "Acceso concedido. Ahora puedes ver los datos del cliente y enviar tu propuesta.",
      creditsCharged: creditsToCharge,
      newBalance: newBalance,
      lead: {
        client_name: lead.client_name,
        client_email: lead.client_email,
        client_phone: lead.client_phone,
        city: lead.city,
        province: lead.province,
        budget_snapshot: lead.budget_snapshot,
      },
      companiesAccessed: newCount,
    })
  } catch (error: any) {
    console.error("[v0] Error accepting lead:", error)
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
  }
}
