import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")

    console.log("[v0] Budget snapshot API called with projectId:", projectId)

    if (!projectId) {
      return NextResponse.json({ error: "projectId requerido" }, { status: 400 })
    }

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Get the project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, title, street, city, province, country")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single()

    if (projectError || !project) {
      console.log("[v0] Project not found:", projectError)
      return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 })
    }

    // Get the budget for this project
    const { data: budget, error: budgetError } = await supabase
      .from("budgets")
      .select("id, total_cost")
      .eq("project_id", projectId)
      .single()

    if (budgetError || !budget) {
      console.log("[v0] No budget found, returning empty snapshot")
      return NextResponse.json({
        budgetId: null,
        estimatedBudget: 0,
        budgetSnapshot: {
          line_items: [],
          adjustments: [],
          total: 0,
        },
      })
    }

    // Get line items (limited to 100)
    const { data: lineItems } = await supabase
      .from("line_items")
      .select("id, description, quantity, unit, unit_cost, total_cost, room_name, category")
      .eq("budget_id", budget.id)
      .limit(100)

    // Get adjustments (limited to 20)
    const { data: adjustments } = await supabase
      .from("budget_adjustments")
      .select("id, description, type, value, calculated_amount")
      .eq("budget_id", budget.id)
      .limit(20)

    console.log("[v0] Budget snapshot created - items:", lineItems?.length || 0)

    return NextResponse.json({
      budgetId: budget.id,
      estimatedBudget: budget.total_cost || 0,
      budgetSnapshot: {
        line_items: lineItems || [],
        adjustments: adjustments || [],
        total: budget.total_cost || 0,
      },
    })
  } catch (error) {
    console.error("[v0] Error getting budget snapshot:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
