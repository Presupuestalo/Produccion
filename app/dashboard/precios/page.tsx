import type { Metadata } from "next"
import { PriceList } from "@/components/precios/price-list"
import { PriceHeader } from "@/components/precios/price-header"

export const metadata: Metadata = {
  title: "Gestión de Precios | Presupuéstalo",
  description: "Gestión de precios para empresas de reformas",
}

export default function PreciosPage() {
  return (
    <div className="w-full max-w-7xl mx-auto px-0 md:px-6 py-0 md:py-8">
      <div className="space-y-0 md:space-y-6">
        <PriceHeader />
        <PriceList />
      </div>
    </div>
  )
}
