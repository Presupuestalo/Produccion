export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { lead_request_id, professional_id, homeowner_id, proposed_budget, proposed_items, message } = body

    console.log("[v0] Sending proposal:", { lead_request_id, professional_id, proposed_budget })

    // Validate required fields
    if (!lead_request_id || !professional_id || !proposed_budget) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    // Check if this professional already sent a proposal for this lead
    const { data: existingProposal } = await supabaseAdmin
      .from("professional_proposals")
      .select("id")
      .eq("lead_request_id", lead_request_id)
      .eq("professional_id", professional_id)
      .maybeSingle()

    if (existingProposal) {
      return NextResponse.json({ error: "Ya has enviado una propuesta para este lead" }, { status: 400 })
    }

    // Get professional info
    const { data: professionalData } = await supabaseAdmin
      .from("profiles")
      .select("full_name, email, phone, company_name")
      .eq("id", professional_id)
      .single()

    // Get homeowner info
    const { data: homeownerData } = await supabaseAdmin
      .from("profiles")
      .select("full_name, email")
      .eq("id", homeowner_id)
      .single()

    // Get lead info
    const { data: leadData } = await supabaseAdmin
      .from("lead_requests")
      .select("reform_types, city, province, companies_accessed_count")
      .eq("id", lead_request_id)
      .single()

    // Insert proposal
    const { data: proposal, error: insertError } = await supabaseAdmin
      .from("professional_proposals")
      .insert({
        lead_request_id,
        professional_id,
        proposed_budget,
        proposed_items,
        message,
        status: "pending",
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error("[v0] Error inserting proposal:", insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    console.log("[v0] Proposal inserted:", proposal.id)

    const currentCount = leadData?.companies_accessed_count || 0
    const { error: updateError } = await supabaseAdmin
      .from("lead_requests")
      .update({
        companies_accessed_count: currentCount + 1,
      })
      .eq("id", lead_request_id)

    if (updateError) {
      console.error("[v0] Error updating companies count:", updateError)
    } else {
      console.log("[v0] Companies count updated to:", currentCount + 1)
    }

    await supabaseAdmin.from("lead_interactions").insert({
      lead_request_id,
      company_id: professional_id,
      action: "proposal_sent",
      accessed_at: new Date().toISOString(),
    })

    // Send email notification to homeowner
    const resendApiKey = process.env.RESEND_API_KEY
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://presupuestalo.com"

    if (resendApiKey && homeownerData?.email) {
      try {
        console.log("[v0] Sending email to:", homeownerData.email)

        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL || "Presupuéstalo <onboarding@resend.dev>",
            to: homeownerData.email,
            subject: `Nueva propuesta recibida para tu proyecto de ${leadData?.reform_types?.[0] || "reforma"}`,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: #f97316; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                  .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
                  .highlight { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #f97316; }
                  .price { font-size: 24px; color: #f97316; font-weight: bold; }
                  .button { display: inline-block; background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; }
                  .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>Nueva Propuesta Recibida</h1>
                  </div>
                  <div class="content">
                    <p>Hola <strong>${homeownerData.full_name || "propietario"}</strong>,</p>
                    <p>Has recibido una nueva propuesta para tu proyecto de reforma en <strong>${leadData?.city}, ${leadData?.province}</strong>.</p>
                    
                    <div class="highlight">
                      <h3 style="margin-top: 0;">Datos de la empresa</h3>
                      <p><strong>Empresa:</strong> ${professionalData?.company_name || professionalData?.full_name || "No especificado"}</p>
                      <p><strong>Contacto:</strong> ${professionalData?.full_name || "No especificado"}</p>
                      <p><strong>Email:</strong> ${professionalData?.email || "No especificado"}</p>
                      <p><strong>Teléfono:</strong> ${professionalData?.phone || "No especificado"}</p>
                    </div>
                    
                    <div class="highlight">
                      <h3 style="margin-top: 0;">Presupuesto propuesto</h3>
                      <p class="price">${Number(proposed_budget).toLocaleString("es-ES", { minimumFractionDigits: 2 })} € (sin IVA)</p>
                    </div>

                    ${message
                ? `
                    <div class="highlight">
                      <h3 style="margin-top: 0;">Mensaje del profesional</h3>
                      <p>${message.replace(/\n/g, "<br>")}</p>
                    </div>
                    `
                : ""
              }

                    <p>Puedes ver todos los detalles de la propuesta y contactar con el profesional desde tu panel de control.</p>
                    
                    <center>
                      <a href="${siteUrl}/dashboard/mis-peticiones" class="button">
                        Ver Propuesta
                      </a>
                    </center>
                  </div>
                  <div class="footer">
                    <p>Este email fue enviado automáticamente por Presupuéstalo.</p>
                    <p>Si no solicitaste este presupuesto, puedes ignorar este mensaje.</p>
                  </div>
                </div>
              </body>
              </html>
            `,
          }),
        })

        if (!emailResponse.ok) {
          const errorData = await emailResponse.json()
          console.error("[v0] Error sending email:", errorData)
        } else {
          console.log("[v0] Email sent successfully to homeowner")
        }
      } catch (emailError) {
        console.error("[v0] Error sending email:", emailError)
        // Don't fail the request if email fails
      }
    } else {
      console.log("[v0] Email not sent - missing API key or homeowner email")
    }

    return NextResponse.json({
      success: true,
      proposal,
      message: "Propuesta enviada correctamente",
    })
  } catch (error: any) {
    console.error("[v0] Error in send proposal:", error)
    return NextResponse.json({ error: error.message || "Error al enviar propuesta" }, { status: 500 })
  }
}

