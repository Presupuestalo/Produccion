import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Hammer, Home, ArrowRight, CheckCircle2 } from "lucide-react"

export function UserTypes() {
  return (
    <section className="py-20 bg-white dark:bg-gray-950">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">¿Para quién es Presupuéstalo?</h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            Una plataforma diseñada tanto para profesionales como para propietarios
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Profesionales */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-100 to-orange-50 dark:from-orange-900/20 dark:to-orange-950/20 rounded-3xl transform group-hover:scale-105 transition-transform" />
            <div className="relative p-8 md:p-10 space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-600 text-white">
                <Hammer className="h-8 w-8" />
              </div>

              <h3 className="text-2xl md:text-3xl font-bold">Para Profesionales</h3>
              <p className="text-lg text-muted-foreground text-pretty">
                Reformistas, constructores y empresas de reformas que quieren optimizar su tiempo y ofrecer presupuestos
                más rápidos y precisos.
              </p>

              <ul className="space-y-3">
                {[
                  "Genera presupuestos en minutos",
                  "Analiza planos automáticamente",
                  "Gestiona múltiples proyectos",
                  "Comparte presupuestos con clientes",
                  "Programa citas y seguimiento",
                ].map((benefit, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>

              <Button asChild className="w-full gap-2" size="lg">
                <Link href="/auth/login">
                  Comenzar como profesional
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Propietarios */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 rounded-3xl transform group-hover:scale-105 transition-transform" />
            <div className="relative p-8 md:p-10 space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-600 text-white">
                <Home className="h-8 w-8" />
              </div>

              <h3 className="text-2xl md:text-3xl font-bold">Para Propietarios</h3>
              <p className="text-lg text-muted-foreground text-pretty">
                Particulares que necesitan reformar su vivienda y quieren tener una idea clara del presupuesto antes de
                contactar profesionales.
              </p>

              <ul className="space-y-3">
                {[
                  "Estima el coste de tu reforma",
                  "Compara diferentes opciones",
                  "Entiende el desglose de costes",
                  "Encuentra profesionales cualificados",
                  "Toma decisiones informadas",
                ].map((benefit, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>

              <Button asChild variant="outline" className="w-full gap-2 bg-transparent" size="lg">
                <Link href="/auth/login">
                  Comenzar como propietario
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
