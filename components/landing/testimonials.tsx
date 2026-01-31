import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"

const testimonials = [
  {
    quote:
      "Presupuéstalo ha revolucionado la forma en que gestiono mis proyectos de reformas. Ahora puedo crear presupuestos precisos en minutos.",
    author: "María García",
    role: "Arquitecta de Interiores",
    avatar: "/maria.png",
  },
  {
    quote:
      "Una herramienta indispensable para cualquier profesional de la construcción. Ha mejorado mi eficiencia y la satisfacción de mis clientes.",
    author: "Carlos Rodríguez",
    role: "Constructor",
    avatar: "/carlos.png",
  },
  {
    quote:
      "Como propietaria de una pequeña empresa de reformas, Presupuéstalo me ha ayudado a competir con empresas más grandes gracias a sus presupuestos profesionales.",
    author: "Ana Martínez",
    role: "Empresaria",
    avatar: "/ana.png",
  },
]

export function Testimonials() {
  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Lo que dicen nuestros usuarios</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Descubre cómo Presupuéstalo está ayudando a profesionales y empresas a mejorar sus procesos.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-none shadow-md">
              <CardContent className="p-6">
                <p className="italic mb-6">"{testimonial.quote}"</p>
                <div className="flex items-center">
                  <div className="mr-4">
                    <img
                      src={testimonial.avatar || "/placeholder.svg"}
                      alt={testimonial.author}
                      className="rounded-full w-[60px] h-[60px] object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-semibold">{testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
