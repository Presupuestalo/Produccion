import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get("userId") || "d2552f2d-ce70-4a2e-a405-3f6119a763d4"

        const { data: profile, error: profileError } = await supabaseAdmin
            .from("profiles")
            .select("id, full_name, email, credits, user_type")
            .eq("id", userId)
            .single()

        const { data: credits, error: creditsError } = await supabaseAdmin
            .from("company_credits")
            .select("*")
            .eq("company_id", userId)
            .single()

        return NextResponse.json({
            userId,
            profile: profile || { error: profileError },
            company_credits: credits || { error: creditsError },
            timestamp: new Date().toISOString()
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
