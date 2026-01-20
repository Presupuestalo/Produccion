import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, Home } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Hasta pronto | Presupuéstalo",
  description: "Esperamos verte de vuelta pronto",
}

export default function DespedidaPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 p-4">
      <Card className="max-w-2xl w-full text-center">
        <CardHeader className="space-y-4 pb-8">
          <div className="mx-auto w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center">
            <Heart className="h-10 w-10 text-orange-600" />
          </div>
          <CardTitle className="text-3xl font-bold">¡Hasta pronto!</CardTitle>
          <CardDescription className="text-lg">Tu cuenta ha sido eliminada correctamente</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4 text-muted-foreground">
            <p>Lamentamos verte partir. Todos tus datos han sido eliminados de forma segura de nuestros sistemas.</p>
            <p className="font-medium text-foreground">Si cambias de opinión, siempre serás bienvenido de vuelta.</p>
            <p className="text-sm">
              Puedes crear una nueva cuenta en cualquier momento y empezar de nuevo con Presupuéstalo.
            </p>
          </div>

          <div className="pt-6 space-y-3">
            <Link href="/" className="block">
              <Button size="lg" className="w-full">
                <Home className="mr-2 h-4 w-4" />
                Volver al inicio
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground">
              ¿Tienes feedback? Escríbenos a{" "}
              <a href="mailto:soporte@presupuestalo.com" className="text-orange-600 hover:underline">
                soporte@presupuestalo.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
