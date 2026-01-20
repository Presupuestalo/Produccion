import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Calculator, ArrowRight, Sparkles } from "lucide-react"

export function Hero() {
  return (
    <div className="relative py-20 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-orange-50 dark:from-orange-950 dark:to-orange-900" />
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23f97316' fillOpacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="container relative z-10 mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center gap-2 px-4 py-2 mb-6 rounded-full bg-orange-100 dark:bg-orange-900 border border-orange-200 dark:border-orange-800">
            <Sparkles className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <span className="text-sm font-medium text-orange-800 dark:text-orange-300">
              Presupuestos de reformas en minutos, no en horas
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 text-balance">
            Calcula presupuestos de <span className="text-orange-600 dark:text-orange-400">reformas</span> con
            información mínima
          </h1>

          <p className="max-w-3xl mx-auto text-lg md:text-xl text-muted-foreground mb-8 text-pretty">
            La plataforma que conecta a profesionales de reformas con propietarios. Analiza planos, calcula presupuestos
            automáticamente y gestiona tus proyectos desde un solo lugar.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8 mb-10 text-sm md:text-base max-w-2xl mx-auto">
            <div className="flex flex-col items-center p-4 rounded-2xl bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-orange-100 dark:border-orange-900/30">
              <div className="text-3xl md:text-4xl font-bold text-orange-600 dark:text-orange-400">90%</div>
              <div className="text-xs md:text-sm text-muted-foreground font-medium uppercase tracking-wider">
                Menos tiempo
              </div>
            </div>
            <div className="flex flex-col items-center p-4 rounded-2xl bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-orange-100 dark:border-orange-900/30">
              <div className="text-3xl md:text-4xl font-bold text-orange-600 dark:text-orange-400">100%</div>
              <div className="text-xs md:text-sm text-muted-foreground font-medium uppercase tracking-wider">Precisión</div>
            </div>
            <div className="flex flex-col items-center p-4 rounded-2xl bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-orange-100 dark:border-orange-900/30 col-span-2 sm:col-span-1">
              <div className="text-3xl md:text-4xl font-bold text-orange-600 dark:text-orange-400">24/7</div>
              <div className="text-xs md:text-sm text-muted-foreground font-medium uppercase tracking-wider">
                Disponible
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="gap-2 text-base">
              <Link href="/auth/login">
                Comenzar gratis
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2 text-base bg-transparent">
              <Link href="#pricing">
                <Calculator className="h-5 w-5" />
                Ver precios
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
