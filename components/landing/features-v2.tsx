"use client"

import { Calculator, Layout, Users, FileText, CheckCircle2, Image as ImageIcon, Briefcase, BarChart3, TrendingUp } from "lucide-react"

const features = [
    {
        title: "Precisión Quirúrgica",
        description: "Algoritmos entrenados con datos reales del sector para que tus presupuestos no dejen margen al error.",
        icon: Calculator,
        gradient: "from-orange-500 to-orange-700",
        features: ["Margen de error < 5%", "Precios de mercado"]
    },
    {
        title: "Marca Profesional",
        description: "Transforma tus cálculos en PDFs de alta gama con tu logo y colores. Olvida el aspecto de 'hecho en casa'.",
        icon: ImageIcon,
        gradient: "from-blue-500 to-indigo-600",
        features: ["PDFs Premium", "Logo Personalizado"]
    },
    {
        title: "Velocidad Extrema",
        description: "Pasa de la primera visita al presupuesto enviado en minutos. Gana la obra antes que tu competencia.",
        icon: TrendingUp,
        gradient: "from-emerald-500 to-teal-600",
        features: ["Ahorro de 5h/semana", "Sin instalaciones"]
    }
]

export function FeaturesV2() {
    return (
        <section id="features" className="py-24 bg-[#050505] relative overflow-hidden">
            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <h2 className="text-sm font-bold tracking-widest text-orange-500 uppercase mb-4">Potencia sin límites</h2>
                    <h3 className="text-4xl md:text-5xl font-bold text-white mb-6">Todo lo que necesitas para tu <br /> reforma en un solo lugar</h3>
                    <p className="text-gray-400 text-lg">
                        Hemos simplificado el proceso complejo de la reforma para que puedas centrarte en lo que realmente importa.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="group p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/[0.08] hover:border-orange-500/30 transition-all duration-500"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                                    <feature.icon className="h-7 w-7 text-white" />
                                </div>
                            </div>
                            <h4 className="text-xl font-bold text-white mb-4">{feature.title}</h4>
                            <p className="text-gray-400 leading-relaxed mb-6">{feature.description}</p>
                            <ul className="space-y-3">
                                {feature.features.map((item, id) => (
                                    <li key={id} className="flex items-center gap-2 text-sm text-gray-300">
                                        <CheckCircle2 className="h-4 w-4 text-orange-500" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>

            {/* Decorative Blur */}
            <div className="absolute top-[20%] right-[-5%] w-[30%] h-[30%] bg-blue-600/10 rounded-full blur-[100px]" />
        </section>
    )
}
