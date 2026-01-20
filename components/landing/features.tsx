import { Calculator, Clock, ImageIcon, Calendar, BarChart3, Shield, Zap, Users } from "lucide-react"

const features = [
  {
    icon: ImageIcon,
    title: "Análisis de Planos con IA",
    description:
      "Sube planos de planta y nuestra IA los analiza automáticamente, identificando espacios, superficies y elementos clave.",
  },
  {
    icon: Calculator,
    title: "Calculadora Inteligente",
    description:
      "Genera presupuestos detallados con desglose por partidas: albañilería, electricidad, fontanería, pintura y más.",
  },
  {
    icon: Calendar,
    title: "Gestión de Citas",
    description: "Programa visitas, reuniones y seguimientos con tus clientes directamente desde la plataforma.",
  },
  {
    icon: BarChart3,
    title: "Análisis Comparativo",
    description: "Compara planos antes y después, visualiza cambios y calcula el impacto en el presupuesto.",
  },
  {
    icon: Clock,
    title: "Ahorro de Tiempo",
    description: "Reduce el tiempo de creación de presupuestos de horas a minutos con automatización inteligente.",
  },
  {
    icon: Users,
    title: "Colaboración",
    description: "Comparte presupuestos y proyectos con clientes y colaboradores de forma segura y profesional.",
  },
  {
    icon: Zap,
    title: "Actualizaciones en Tiempo Real",
    description: "Modifica presupuestos al instante y ve los cambios reflejados inmediatamente en todos los cálculos.",
  },
  {
    icon: Shield,
    title: "Datos Seguros",
    description: "Tu información y la de tus clientes siempre protegida con encriptación de nivel empresarial.",
  },
]

export function Features() {
  return (
    <section
      id="features"
      className="py-20 bg-gradient-to-b from-orange-50 to-white dark:from-orange-950 dark:to-gray-950"
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Características Principales</h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            Todas las herramientas que necesitas para gestionar tus proyectos de reformas de forma profesional
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-6 border rounded-2xl hover:shadow-lg hover:border-orange-200 dark:hover:border-orange-800 transition-all bg-white dark:bg-gray-900"
            >
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <feature.icon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground text-pretty">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
