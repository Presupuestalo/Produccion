import { PaymentsSection } from "@/components/payments/payments-section"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function CobrosPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Obtener el proyecto y su presupuesto aceptado
  const { data: project } = await supabase
    .from("projects")
    .select("*, accepted_budget:budgets!inner(total_price)")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single()

  if (!project) redirect("/dashboard/projects")

  const budgetAmount = project.accepted_budget?.total_price || 0

  return (
    <div className="container mx-auto py-6">
      <PaymentsSection projectId={params.id} budgetAmount={budgetAmount} />
    </div>
  )
}
