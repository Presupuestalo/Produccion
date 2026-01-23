import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()

    if (!supabase) {
      return NextResponse.json({ error: "Error de servidor (Supabase no inicializado)" }, { status: 500 })
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    if (!supabase) {
      return NextResponse.json({ error: "Error de servidor (Supabase no inicializado)" }, { status: 500 })
    }

    const { data: credits, error: creditsError } = await supabaseAdmin
      .from("company_credits")
      .select("*")
      .eq("company_id", user.id)
      .single()

    if (creditsError) {
      console.error("[v0] creditsError details:", JSON.stringify(creditsError))

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
        console.log("[v0] Initializing credits for user:", user.id)

        // Intentamos insertar sin updated_at por si acaso la columna no existe
        const { data: newCredits, error: insertError } = await supabaseAdmin
          .from("company_credits")
          .upsert({
            company_id: user.id,
            credits_balance: 0,
            credits_purchased_total: 0,
            credits_spent_total: 0,
          }, { onConflict: 'company_id' })
          .select()
          .single()

        if (insertError) {
          console.error("[v0] CRITICAL: insertError details:", JSON.stringify(insertError))
          return NextResponse.json({
            error: "Error al crear registro de créditos",
            details: insertError.message,
            code: insertError.code,
            hint: insertError.hint
          }, { status: 500 })
        }

        return NextResponse.json(newCredits)
      }

      return NextResponse.json({
        error: creditsError.message,
        details: creditsError
      }, { status: 500 })
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
