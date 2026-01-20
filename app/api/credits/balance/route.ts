import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { data: credits, error: creditsError } = await supabase
      .from("company_credits")
      .select("*")
      .eq("company_id", user.id)
      .single()

    if (creditsError) {
      if (creditsError.code === "42P01" || creditsError.message?.includes("does not exist")) {
        return NextResponse.json(
          { 
            error: "Marketplace no configurado. Las tablas necesarias no existen.",
            needsSetup: true,
            credits_balance: 0 
          },
          { status: 404 }
        )
      }
      
      // Si no hay registro, inicializar
      if (creditsError.code === "PGRST116") {
        const { data: newCredits, error: insertError } = await supabase
          .from("company_credits")
          .insert({
            company_id: user.id,
            credits_balance: 0,
            credits_purchased_total: 0,
            credits_spent_total: 0,
          })
          .select()
          .single()

        if (insertError) {
          console.error("[v0] Error creating credits record:", insertError)
          return NextResponse.json({ error: "Error al crear registro de créditos" }, { status: 500 })
        }

        return NextResponse.json(newCredits)
      }
      
      return NextResponse.json({ error: creditsError.message }, { status: 500 })
    }

    return NextResponse.json(credits)
  } catch (error: any) {
    console.error("[v0] Error fetching credits balance:", error)
    if (error.message?.includes("does not exist") || error.code === "42P01") {
      return NextResponse.json(
        { 
          error: "Marketplace no configurado. Las tablas necesarias no existen.",
          needsSetup: true,
          credits_balance: 0 
        },
        { status: 404 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
