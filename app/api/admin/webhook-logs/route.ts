import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export const dynamic = "force-dynamic"

export async function GET() {
    try {
        const logPath = path.join(process.cwd(), "webhook_hits.log")

        if (!fs.existsSync(logPath)) {
            return NextResponse.json({ message: "No hits recorded yet." })
        }

        const content = fs.readFileSync(logPath, "utf8")
        return new NextResponse(content, {
            headers: { "Content-Type": "text/plain; charset=utf-8" }
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
