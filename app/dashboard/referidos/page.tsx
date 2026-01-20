import type { Metadata } from "next"
import { ReferralDashboard } from "@/components/referrals/referral-dashboard"

export const metadata: Metadata = {
  title: "Programa de Referidos | Presupuéstalo",
  description: "Invita a amigos y gana créditos gratis",
}

export default function ReferidosPage() {
  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Programa de Referidos</h1>
        <p className="text-muted-foreground mt-2">
          Invita a tus amigos y colegas a Presupuéstalo. Ambos recibiréis créditos gratis cuando contraten un plan.
        </p>
      </div>

      <ReferralDashboard />
    </div>
  )
}
