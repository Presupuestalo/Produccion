export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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

    // Obtener historial de transacciones
    const { data: transactions, error: transactionsError } = await supabase
      .from("credit_transactions")
      .select("*")
      .eq("company_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50)

    if (transactionsError) {
      console.error("[v0] Error fetching transactions:", transactionsError)
      return NextResponse.json({ error: "Error al obtener transacciones" }, { status: 500 })
    }

    return NextResponse.json({ transactions: transactions || [] })
  } catch (error: any) {
    console.error("[v0] Error fetching transactions:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

