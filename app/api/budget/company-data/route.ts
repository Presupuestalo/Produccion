import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

/**
 * GET /api/budget/company-data?budget_id=xxx
 *
 * Returns the company data of the professional who created the given budget.
 * This is needed because RLS on user_company_settings only allows users to read
 * their own data, but homeowners need to see the professional's company data
 * when exporting a PDF.
 *
 * Security:
 * - The requesting user must be authenticated.
 * - The requesting user must have access to the budget (either be the budget
 *   owner OR be the homeowner of the project linked to the budget).
 * - The actual company data is fetched using the service role (bypasses RLS)
 *   only after authorization is confirmed.
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const budgetId = searchParams.get("budget_id")

        if (!budgetId) {
            return NextResponse.json({ error: "budget_id is required" }, { status: 400 })
        }

        // Use the regular client (with RLS) to verify the caller's identity and access
        const supabase = await createClient()
        if (!supabase) {
            return NextResponse.json({ error: "Failed to initialize Supabase client" }, { status: 500 })
        }

        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Fetch the budget to find which professional created it and its project
        const { data: budget, error: budgetError } = await supabase
            .from("budgets")
            .select("user_id, project_id")
            .eq("id", budgetId)
            .single()

        if (budgetError || !budget) {
            return NextResponse.json({ error: "Budget not found" }, { status: 404 })
        }

        // Verify the requesting user has access:
        // Option A: they are the professional who created the budget
        const isOwner = budget.user_id === user.id

        if (!isOwner) {
            // Option B: they are the homeowner of the project linked to the budget
            const { data: project, error: projectError } = await supabase
                .from("projects")
                .select("user_id")
                .eq("id", budget.project_id)
                .single()

            if (projectError || !project || project.user_id !== user.id) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 })
            }
        }

        // Authorization confirmed — now use the service role client to bypass RLS
        // and fetch the professional's company data
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

        if (!serviceRoleKey || !supabaseUrl) {
            console.error("[api/budget/company-data] Missing service role key or Supabase URL")
            return NextResponse.json({ companyData: null })
        }

        const adminClient = createAdminClient(supabaseUrl, serviceRoleKey)

        const { data: companyData, error: companyError } = await adminClient
            .from("user_company_settings")
            .select(
                "company_name, company_address, company_city, company_province, company_postal_code, company_tax_id, company_phone, company_email, company_website, company_logo_url, default_presentation_text, default_clarification_notes, show_vat, vat_percentage",
            )
            .eq("user_id", budget.user_id)
            .maybeSingle()

        if (companyError) {
            console.error("[api/budget/company-data] Error fetching company data:", companyError)
            // Return null data rather than erroring — company data is optional in the PDF
            return NextResponse.json({ companyData: null })
        }

        return NextResponse.json({ companyData })
    } catch (error) {
        console.error("[api/budget/company-data] Unexpected error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
