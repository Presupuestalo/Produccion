import type { Metadata } from "next"
import { UserTypeSelection } from "@/components/auth/user-type-selection"
import { Calculator } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Tipo de Usuario | Presupuéstalo",
  description: "Selecciona tu tipo de usuario en Presupuéstalo",
}

export default function UserTypePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto">
        {/* Logo */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
              <Calculator className="h-7 w-7 text-white" />
            </div>
            <span className="text-3xl font-bold text-gray-900">Presupuéstalo</span>
          </Link>
        </div>

        <UserTypeSelection />
      </div>
    </div>
  )
}
