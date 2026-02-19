export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
    try {
        const supabase = await createClient()
        if (!supabase) {
            return NextResponse.json({ error: "Configuración de servidor incompleta" }, { status: 500 })
        }

        const {
            data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        // Fetch user's projects with info about which floor plan variants are already taken
        const { data: projects, error } = await supabase
            .from("projects")
            .select("id, title, client")
            .eq("user_id", session.user.id)
            .order("created_at", { ascending: false })

        if (error) {
            console.error("Error fetching projects:", error)
            return NextResponse.json({ projects: [] })
        }

        // For each project, check which floor plan variants already exist
        const { data: existingPlans } = await supabase
            .from("project_floor_plans")
            .select("project_id, variant")
            .in("project_id", (projects || []).map(p => p.id))

        const plansByProject = new Map<string, string[]>()
        for (const plan of existingPlans || []) {
            if (!plan.project_id) continue
            const existing = plansByProject.get(plan.project_id) || []
            existing.push(plan.variant)
            plansByProject.set(plan.project_id, existing)
        }

        const formattedProjects = (projects || []).map((p: any) => ({
            id: p.id,
            title: p.title || "Sin nombre",
            client: p.client || "",
            usedVariants: plansByProject.get(p.id) || [],
        }))

        return NextResponse.json({ projects: formattedProjects })
    } catch (error) {
        console.error("Error in projects list:", error)
        return NextResponse.json({ projects: [] })
    }
}
