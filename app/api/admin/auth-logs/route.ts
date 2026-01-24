import { NextResponse } from "next/server"
import { authLogs } from "@/app/auth/callback/route"

export const dynamic = "force-dynamic"

export async function GET() {
    try {
        if (!authLogs || authLogs.length === 0) {
            return NextResponse.json({
                message: "No auth attempts recorded in this instance yet.",
                hint: "Logs are kept in memory and reset on redeploy/cold start. Perform a login attempt then check this page immediately."
            })
        }

        return new NextResponse(authLogs.join("\n"), {
            headers: { "Content-Type": "text/plain; charset=utf-8" }
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
