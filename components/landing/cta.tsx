import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function CTA() {
  return (
    <section className="py-20 bg-orange-600 dark:bg-orange-800">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 text-balance px-2">
          Comienza a crear presupuestos inteligentes hoy mismo
        </h2>
        <p className="text-xl text-orange-100 max-w-2xl mx-auto mb-8">
          Únete a miles de profesionales que ya están optimizando sus procesos con Presupuéstalo.
        </p>
        <Button asChild size="lg" variant="secondary" className="gap-2">
          <Link href="/auth/login">
            Registrarse gratis
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  )
}
