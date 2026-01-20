import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

type RouteContext = {
  params: Promise<{ projectId: string }>
}

export async function GET(req: Request, context: RouteContext) {
  try {
    console.log("[v0] Budget snapshot API called")

    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("[v0] Auth error:", authError)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { projectId } = await context.params
    console.log("[v0] Getting budget snapshot for project:", projectId, "user:", user.id)

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, name, budget, user_id")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single()

    if (projectError || !project) {
      console.error("[v0] Project error:", projectError)
      return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 })
    }

    const { data: budget, error: budgetError } = await supabase
      .from("budgets")
      .select(
        `
        id,
        total,
        subtotal,
        tax_amount,
        tax_rate,
        status,
        created_at,
        budget_line_items(id, description, quantity, unit, unit_price, total, category, room_name, item_order),
        budget_adjustments(id, type, description, amount, percentage, created_at)
      `,
      )
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (budgetError || !budget) {
      console.error("[v0] Budget error:", budgetError)
      return NextResponse.json({
        budgetId: null,
        estimatedBudget: project.budget || 0,
        budgetSnapshot: {
          budget_id: null,
          total: project.budget || 0,
          subtotal: project.budget || 0,
          tax_amount: 0,
          tax_rate: 21,
          status: "draft",
          line_items: [],
          adjustments: [],
          metadata: {
            total_line_items: 0,
            included_line_items: 0,
            captured_at: new Date().toISOString(),
          },
        },
      })
    }

    const lineItems = budget.budget_line_items || []
    const limitedLineItems = lineItems.slice(0, 100).map((item: any) => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      unit_price: item.unit_price,
      total: item.total,
      category: item.category,
      room_name: item.room_name,
    }))

    const budgetSnapshot = {
      budget_id: budget.id,
      total: budget.total,
      subtotal: budget.subtotal,
      tax_amount: budget.tax_amount,
      tax_rate: budget.tax_rate,
      status: budget.status,
      line_items: limitedLineItems,
      adjustments: (budget.budget_adjustments || []).slice(0, 20).map((adj: any) => ({
        id: adj.id,
        type: adj.type,
        description: adj.description,
        amount: adj.amount,
        percentage: adj.percentage,
      })),
      metadata: {
        total_line_items: lineItems.length,
        included_line_items: limitedLineItems.length,
        captured_at: new Date().toISOString(),
      },
    }

    console.log("[v0] Budget snapshot created with", limitedLineItems.length, "of", lineItems.length, "line items")

    return NextResponse.json({
      budgetId: budget.id,
      estimatedBudget: budget.total || 0,
      budgetSnapshot,
    })
  } catch (error: any) {
    console.error("[v0] Error getting budget snapshot:", error)
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
  }
}
