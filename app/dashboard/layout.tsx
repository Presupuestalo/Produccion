import type React from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { DashboardHeader } from "@/components/dashboard/header"
import { PendingPlanModal } from "@/components/dashboard/pending-plan-modal"
import { Suspense } from "react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
        <DashboardHeader />
        <main className="flex-1 p-4 md:p-6">{children}</main>
        <Suspense fallback={null}>
          <PendingPlanModal />
        </Suspense>
      </div>
    </ProtectedRoute>
  )
}
