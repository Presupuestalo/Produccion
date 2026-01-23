import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export const dynamic = "force-dynamic"

export async function GET() {
    try {
        const logPath = path.join(process.cwd(), "auth_debug.log")
        console.log("[AuthLogViewer] Accessing path:", logPath)

        if (!fs.existsSync(logPath)) {
            return NextResponse.json({ message: "No auth attempts recorded yet.", pathSearched: logPath })
        }

        const content = fs.readFileSync(logPath, "utf8")
        return new NextResponse(content, {
            headers: { "Content-Type": "text/plain; charset=utf-8" }
        })
    } catch (error: any) {
        return NextResponse.json({
            error: "Failed to read logs",
            message: error.message,
            stack: error.stack
        }, { status: 500 })
    }
}
