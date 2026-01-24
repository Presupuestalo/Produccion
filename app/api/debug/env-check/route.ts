import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
    const vars = [
        "STRIPE_WEBHOOK_SECRET",
        "STRIPE_SECRET_KEY",
        "NEXT_PUBLIC_SUPABASE_URL",
        "SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY",
        "SUPABASE_SECRET_KEY",
        "VERCEL_ENV"
    ]

    const status: Record<string, string> = {}
    vars.forEach(v => {
        const val = process.env[v]
        if (!val) {
            status[v] = "MISSING"
        } else {
            // For URLs, show the last part. For keys, show start/end.
            if (val.startsWith("http")) {
                const url = new URL(val)
                status[v] = `URL: ...${url.hostname}`
            } else {
                status[v] = `${val.substring(0, 8)}...${val.substring(val.length - 4)}`
            }
        }
    })

    return NextResponse.json(status)
}
