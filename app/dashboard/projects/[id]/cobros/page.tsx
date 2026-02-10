import { PaymentsSection } from "@/components/payments/payments-section"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function CobrosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  if (!supabase) {
    redirect("/dashboard/projects")
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // 1. Obtener el proyecto
  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (!project) redirect("/dashboard/projects")

  // 2. Obtener el presupuesto aceptado para este proyecto (más robusto que join)
  const { data: budget } = await supabase
    .from("budgets")
    .select("total")
    .eq("project_id", id)
    .eq("status", "accepted")
    .maybeSingle()

  const budgetAmount = budget?.total || 0

  return (
    <div className="container mx-auto py-6">
      <PaymentsSection projectId={id} budgetAmount={budgetAmount} />
    </div>
  )
}
