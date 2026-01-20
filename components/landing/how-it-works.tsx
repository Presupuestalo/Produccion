import { Upload, Sparkles, FileText, CheckCircle } from "lucide-react"

const steps = [
  {
    icon: Upload,
    title: "1. Sube tus planos",
    description:
      "Carga los planos de la vivienda o describe el proyecto. Nuestro sistema acepta imágenes, PDFs y descripciones de texto.",
    image: "/uploading-floor-plan-blueprint-to-construction-app.jpg",
  },
  {
    icon: Sparkles,
    title: "2. Análisis automático",
    description:
      "Nuestra IA analiza los planos, identifica espacios, calcula superficies y detecta elementos clave de la reforma.",
    image: "/ai-analyzing-construction-floor-plan-with-measurem.jpg",
  },
  {
    icon: FileText,
    title: "3. Presupuesto generado",
    description:
      "Obtén un presupuesto detallado con desglose por partidas: albañilería, electricidad, fontanería, pintura y más.",
    image: "/detailed-construction-budget-breakdown-with-costs-.jpg",
  },
  {
    icon: CheckCircle,
    title: "4. Gestiona tu proyecto",
    description:
      "Comparte el presupuesto con clientes, programa citas, y lleva el seguimiento de tus proyectos desde el dashboard.",
    image: "/project-management-dashboard-for-construction-with.jpg",
  },
]

export function HowItWorks() {
  return (
    <section
      id="como-funciona"
      className="py-20 bg-gradient-to-b from-white to-orange-50 dark:from-gray-950 dark:to-orange-950"
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">¿Cómo funciona?</h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            Cuatro pasos simples para obtener presupuestos profesionales de reformas
          </p>
        </div>

        <div className="space-y-24">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`flex flex-col ${index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"} items-center gap-12`}
            >
              <div className="flex-1 space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-100 dark:bg-orange-900">
                  <step.icon className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold">{step.title}</h3>
                <p className="text-lg text-muted-foreground text-pretty">{step.description}</p>
              </div>

              <div className="flex-1">
                <div className="relative rounded-2xl overflow-hidden shadow-xl border-2 border-orange-100 dark:border-orange-900 bg-gradient-to-br from-orange-50 to-white dark:from-orange-950 dark:to-gray-900 p-12">
                  <div className="aspect-square w-full flex items-center justify-center">
                    <step.icon className="h-32 w-32 text-orange-600 dark:text-orange-400 opacity-20" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
