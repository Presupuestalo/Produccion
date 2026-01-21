export const dynamic = "force-dynamic"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateBudgetHTML } from "@/lib/utils/generate-budget-pdf"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const projectId = searchParams.get("projectId")

  if (!projectId) {
    return NextResponse.json({ error: "Project ID required" }, { status: 400 })
  }

  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, company_name, phone, cif, address, city, province")
      .eq("id", user.id)
      .single()

    // Get project
    const { data: project, error: projectError } = await supabase
      .from("coordinator_projects")
      .select("*")
      .eq("id", projectId)
      .eq("coordinator_id", user.id)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Get trades
    const { data: trades } = await supabase
      .from("coordinator_project_trades")
      .select(`
        *,
        trade_types(name)
      `)
      .eq("project_id", projectId)
      .order("created_at")

    // Calculate totals
    const calculateFinalBudget = (original: number, marginType: string, marginValue: number) => {
      if (marginType === "percentage") {
        return original * (1 + marginValue / 100)
      }
      return original + marginValue
    }

    const tradesForPDF = (trades || []).map((trade) => ({
      trade_name: trade.trade_types?.name || trade.trade_name || "Trabajo",
      supplier_name: trade.supplier_name,
      final_budget: calculateFinalBudget(trade.original_budget, trade.margin_type, trade.margin_value),
    }))

    const subtotal = tradesForPDF.reduce((sum, t) => sum + t.final_budget, 0)
    const coordinationFee =
      project.coordination_fee_type === "percentage"
        ? subtotal * (project.coordination_fee / 100)
        : project.coordination_fee || 0
    const total = subtotal + coordinationFee

    const pdfData = {
      project: {
        name: project.project_name,
        client_name: project.client_name,
        client_email: project.client_email,
        client_phone: project.client_phone,
        address: project.address,
        city: project.city,
        province: project.province,
        description: project.description,
        created_at: project.created_at,
      },
      coordinator: {
        name: profile?.full_name || user.email || "Coordinador",
        company_name: profile?.company_name,
        phone: profile?.phone,
        email: user.email,
        cif: profile?.cif,
        address: profile?.address ? `${profile.address}, ${profile.city || ""} ${profile.province || ""}` : undefined,
      },
      trades: tradesForPDF,
      totals: {
        subtotal,
        coordination_fee: coordinationFee,
        coordination_fee_label:
          project.coordination_fee_type === "percentage"
            ? `CoordinaciÃ³n y gestiÃ³n (${project.coordination_fee}%)`
            : "CoordinaciÃ³n y gestiÃ³n",
        total,
      },
    }

    const html = generateBudgetHTML(pdfData)

    // Return HTML that can be printed as PDF
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    })
  } catch (error: any) {
    console.error("Error generating budget PDF:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

