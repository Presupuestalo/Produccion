"use client"

import type React from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { DashboardHeader } from "@/components/dashboard/header"
import { PendingPlanModal } from "@/components/dashboard/pending-plan-modal"
import { ProvinceCheck } from "@/components/dashboard/province-check"
import { DonationPopup } from "@/components/dashboard/donation-popup"
import { Suspense } from "react"
import { usePathname } from "next/navigation"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isVisor = pathname?.includes("/editor-planos/visor")

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
        {!isVisor && <DashboardHeader />}
        <main className={`flex-1 ${isVisor ? "" : "p-4 md:p-6"}`}>{children}</main>
        {!isVisor && <ProvinceCheck />}
        {!isVisor && (
          <Suspense fallback={null}>
            <PendingPlanModal />
          </Suspense>
        )}
        {!isVisor && <DonationPopup />}
      </div>
    </ProtectedRoute>
  )
}
