import { NextResponse } from "next/server"
import { webhookLogs } from "@/app/api/webhooks/stripe/route"

export const dynamic = "force-dynamic"

export async function GET() {
    try {
        if (!webhookLogs || webhookLogs.length === 0) {
            return NextResponse.json({ message: "No webhook hits recorded in this instance." })
        }

        return new NextResponse(webhookLogs.join("\n"), {
            headers: { "Content-Type": "text/plain; charset=utf-8" }
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
