import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function DELETE(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: "ID de plano requerido" }, { status: 400 })
        }

        const supabase = await createClient()
        if (!supabase) {
            return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 })
        }

        const {
            data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        // Delete the plan
        // RLS (Row Level Security) on the database should ensure users can only delete their own plans
        // but explicit user_id check is a good safety measure if RLS isn't perfect
        const { error } = await supabase
            .from("project_floor_plans")
            .delete()
            .eq("id", id)
            .eq("user_id", session.user.id)

        if (error) {
            console.error("Error deleting plan:", error)
            return NextResponse.json({ error: "Error al eliminar el plano" }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error("Delete plan error:", error)
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        )
    }
}
