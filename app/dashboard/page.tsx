import type { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Dashboard | Presupuéstalo",
  description: "Panel de control de Presupuéstalo",
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ pendingPlan?: string; billingType?: string }>
}) {
  const params = await searchParams
  const pendingPlan = params.pendingPlan
  const billingType = params.billingType

  if (pendingPlan) {
    redirect(`/dashboard/projects?pendingPlan=${pendingPlan}&billingType=${billingType || "monthly"}`)
  }

  redirect("/dashboard/projects")
}
