"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  CreditCard,
  Package,
  RefreshCw,
  Plus,
  CheckCircle,
  Copy,
  ExternalLink,
  Calendar,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface StripeProduct {
  id: string
  name: string
  description: string | null
  metadata: Record<string, string>
  prices: Array<{
    id: string
    amount: number | null
    currency: string
    interval?: string
  }>
}

interface CreatedProduct {
  packageId?: string
  planId?: string
  productId: string
  priceId: string
  name: string
  credits?: number
  priceInEuros: number
  interval?: string
}

export default function StripeSetupPage() {
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [existingProducts, setExistingProducts] = useState<StripeProduct[]>([])
  const [createdProducts, setCreatedProducts] = useState<CreatedProduct[]>([])
  const [hasChecked, setHasChecked] = useState(false)

  const checkExistingProducts = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/stripe/create-products")
      const data = await response.json()
      if (data.success) {
        setExistingProducts(data.products)
        setHasChecked(true)
        toast.success(`Se encontraron ${data.products.length} productos en Stripe`)
      } else {
        toast.error("Error al verificar productos: " + data.error)
      }
    } catch (error) {
      toast.error("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  const createProducts = async () => {
    setCreating(true)
    try {
      const response = await fetch("/api/stripe/create-products", {
        method: "POST",
      })
      const data = await response.json()
      if (data.success) {
        setCreatedProducts(data.products)
        toast.success("Productos creados exitosamente en Stripe")
      } else {
        toast.error("Error al crear productos: " + data.error)
      }
    } catch (error) {
      toast.error("Error de conexión")
    } finally {
      setCreating(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copiado al portapapeles")
  }

  const testCards = [
    { number: "4242 4242 4242 4242", brand: "Visa", result: "Pago exitoso" },
    { number: "4000 0000 0000 3220", brand: "Visa", result: "Requiere 3D Secure" },
    { number: "4000 0000 0000 9995", brand: "Visa", result: "Pago rechazado (fondos insuficientes)" },
    { number: "5555 5555 5555 4444", brand: "Mastercard", result: "Pago exitoso" },
  ]

  const bonos = [
    { name: "Bono 500", price: 50, credits: 500 },
    { name: "Bono 1200", price: 100, credits: 1200 },
    { name: "Bono 2500", price: 200, credits: 2500 },
  ]

  const planes = [
    { name: "Plan Básico", monthlyPrice: 29, yearlyPrice: 290 },
    { name: "Plan Profesional", monthlyPrice: 59, yearlyPrice: 590 },
    { name: "Plan Empresa", monthlyPrice: 99, yearlyPrice: 990 },
  ]

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Configuración de Stripe</h1>
            <p className="text-muted-foreground">Crea los productos y prueba los pagos en modo sandbox (TEST)</p>
          </div>
          <Badge variant="outline" className="ml-auto bg-yellow-100 text-yellow-800 border-yellow-300">
            MODO TEST
          </Badge>
        </div>

        {/* Step 1: Check existing products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Paso 1: Verificar productos existentes
            </CardTitle>
            <CardDescription>Comprueba si ya tienes productos creados en Stripe (modo test)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={checkExistingProducts} disabled={loading}>
              {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Verificar productos en Stripe
            </Button>

            {hasChecked && existingProducts.length === 0 && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-amber-800">No se encontraron productos. Créalos en el Paso 2.</p>
              </div>
            )}

            {existingProducts.length > 0 && (
              <div className="space-y-2">
                <p className="font-medium text-green-600">Productos encontrados ({existingProducts.length}):</p>
                {existingProducts.map((product) => (
                  <div key={product.id} className="p-3 bg-muted rounded-lg flex justify-between items-center">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.prices[0]?.amount ? `${(product.prices[0].amount / 100).toFixed(2)}€` : "Sin precio"}
                        {product.prices[0]?.interval && ` / ${product.prices[0].interval === "month" ? "mes" : "año"}`}
                      </p>
                    </div>
                    {product.metadata.credits && <Badge variant="secondary">{product.metadata.credits} créditos</Badge>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 2: Create products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Paso 2: Crear productos en Stripe
            </CardTitle>
            <CardDescription>Crea los bonos de créditos y planes de suscripción</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Bonos */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Bonos de Créditos (pago único)
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {bonos.map((bono) => (
                  <div key={bono.name} className="p-4 border rounded-lg text-center">
                    <p className="font-bold text-lg">{bono.name}</p>
                    <p className="text-2xl font-bold text-primary">{bono.price}€</p>
                    <p className="text-muted-foreground">{bono.credits.toLocaleString()} créditos</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Planes */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Planes de Suscripción (mensual y anual)
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {planes.map((plan) => (
                  <div key={plan.name} className="p-4 border rounded-lg text-center">
                    <p className="font-bold text-lg">{plan.name}</p>
                    <p className="text-xl font-bold text-primary">
                      {plan.monthlyPrice}€<span className="text-sm font-normal text-muted-foreground">/mes</span>
                    </p>
                    <p className="text-sm text-muted-foreground">{plan.yearlyPrice}€/año</p>
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={createProducts} disabled={creating} className="w-full" size="lg">
              {creating ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Crear todos los productos en Stripe (TEST)
            </Button>

            {createdProducts.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Productos creados exitosamente</span>
                </div>
                <div className="p-4 bg-muted rounded-lg space-y-2 max-h-64 overflow-y-auto">
                  <p className="text-sm font-medium">IDs de precios creados:</p>
                  {createdProducts.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-background rounded">
                      <div>
                        <code className="text-xs font-medium">{p.name}</code>
                        {p.interval && (
                          <span className="text-xs text-muted-foreground ml-2">
                            ({p.interval === "month" ? "mensual" : "anual"})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="text-xs text-muted-foreground">{p.priceId}</code>
                        <Button size="sm" variant="ghost" onClick={() => copyToClipboard(p.priceId)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 3: Test cards */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Paso 3: Probar pagos
            </CardTitle>
            <CardDescription>Usa estas tarjetas de prueba en el checkout de Stripe</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {testCards.map((card, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{card.brand}</Badge>
                    <code className="font-mono">{card.number}</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm ${
                        card.result.includes("exitoso")
                          ? "text-green-600"
                          : card.result.includes("rechazado")
                            ? "text-red-600"
                            : "text-amber-600"
                      }`}
                    >
                      {card.result}
                    </span>
                    <Button size="sm" variant="ghost" onClick={() => copyToClipboard(card.number.replace(/\s/g, ""))}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Para probar:</strong> Usa cualquier fecha futura (ej: 12/28), cualquier CVC de 3 dígitos (ej:
                123), y cualquier código postal (ej: 28001).
              </p>
            </div>

            <div className="flex gap-2">
              <Link href="/dashboard/creditos" className="flex-1">
                <Button className="w-full">
                  Ir a comprar créditos
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <a
                href="https://dashboard.stripe.com/test/payments"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button variant="outline" className="w-full bg-transparent">
                  Ver pagos en Stripe
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
