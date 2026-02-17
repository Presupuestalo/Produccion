import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()

    if (!supabase) {
      return NextResponse.json({ error: "Failed to initialize Supabase client" }, { status: 500 })
    }

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, user_type, email, is_admin")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("Error fetching profile:", profileError)
      return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
    }

    // Fetch company settings from dedicated table
    const { data: companySettings, error: settingsError } = await supabase
      .from("user_company_settings")
      .select("company_name, company_address, company_phone, company_email, company_tax_id, company_website, company_logo_url")
      .eq("user_id", user.id)
      .maybeSingle()

    if (settingsError) {
      console.error("Error fetching company settings:", settingsError)
      // We continue since settings might not exist yet for a new user
    }

    return NextResponse.json({
      ...profile,
      company_name: companySettings?.company_name,
      company_address: companySettings?.company_address,
      company_phone: companySettings?.company_phone,
      company_email: companySettings?.company_email,
      company_cif: companySettings?.company_tax_id,
      company_website: companySettings?.company_website,
      company_logo_url: companySettings?.company_logo_url
    })
  } catch (error) {
    console.error("Error in profile route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
