import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { MASTER_EMAILS } from "@/lib/feature-flags"

export const dynamic = "force-dynamic"

export async function GET() {
    try {
        const supabase = await createClient()

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return NextResponse.json({
                error: "No estás autenticado",
                loggedIn: false,
            }, { status: 401 })
        }

        // Get profile
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("id, email, role, user_type, subscription_plan")
            .eq("id", user.id)
            .single()

        const isMasterEmail = MASTER_EMAILS.includes(user.email || "")

        const diagnostics = {
            user: {
                id: user.id,
                email: user.email,
                isMasterEmail,
            },
            profile: profile || null,
            profileError: profileError?.message || null,
            checks: {
                isAuthenticated: !!user,
                hasProfile: !!profile,
                roleInProfile: profile?.role || "NO ROLE SET",
                isMasterRole: profile?.role === "master",
                isMasterEmail,
                shouldHaveAIAccess: isMasterEmail || profile?.role === "master",
            },
            recommendation: "",
        }

        // Generate recommendation
        if (!profile) {
            diagnostics.recommendation = "❌ No se encontró perfil. Cierra sesión y vuelve a iniciar."
        } else if (!profile.role || profile.role !== "master") {
            if (isMasterEmail) {
                diagnostics.recommendation = "⚠️ Eres un email master pero tu rol no está configurado como 'master'. Ejecuta el script fix-master-role.sql"
            } else {
                diagnostics.recommendation = "ℹ️ No eres usuario master. Solo los usuarios con rol 'master' pueden usar IA."
            }
        } else {
            diagnostics.recommendation = "✅ Tu configuración está correcta. Las herramientas de IA deberían estar disponibles."
        }

        return NextResponse.json(diagnostics)
    } catch (error) {
        console.error("[Check Master] Error:", error)
        return NextResponse.json({
            error: "Error al verificar el estado master",
            details: error instanceof Error ? error.message : String(error),
        }, { status: 500 })
    }
}
