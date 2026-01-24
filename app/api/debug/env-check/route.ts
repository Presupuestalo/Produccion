import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
    const vars = [
        "STRIPE_WEBHOOK_SECRET",
        "STRIPE_SECRET_KEY",
        "NEXT_PUBLIC_SUPABASE_URL",
        "SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY",
        "VERCEL_ENV",
        "VERCEL_URL"
    ]

    const status: Record<string, string> = {}
    vars.forEach(v => {
        const val = process.env[v]
        if (!val) {
            status[v] = "MISSING"
        } else {
            // Show first 6 and last 4 chars
            status[v] = `${val.substring(0, 6)}...${val.substring(val.length - 4)}`
        }
    })

    return NextResponse.json(status)
}
