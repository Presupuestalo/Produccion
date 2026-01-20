"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Trash2, Plus, Minus, ShoppingBag } from "lucide-react"
import Link from "next/link"
import { useCart } from "@/lib/hooks/use-cart"
import { useRouter } from "next/navigation"
import Image from "next/image"

export default function CarritoPage() {
  const { items, removeItem, updateQuantity, total, itemCount, clearCart } = useCart()
  const router = useRouter()

  const handleCheckout = () => {
    if (items.length === 0) return
    router.push("/dashboard/tienda/checkout")
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <Link href="/dashboard/tienda">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a la tienda
            </Button>
          </Link>

          <Card className="p-12 text-center max-w-md mx-auto">
            <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Tu carrito está vacío</h2>
            <p className="text-gray-600 mb-6">Añade productos para empezar tu pedido</p>
            <Link href="/dashboard/tienda">
              <Button className="bg-orange-600 hover:bg-orange-700">Ir a la tienda</Button>
            </Link>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <Link href="/dashboard/tienda">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Seguir comprando
          </Button>
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold text-gray-900">Carrito ({itemCount} productos)</h1>
              <Button variant="ghost" className="text-red-600 hover:text-red-700" onClick={clearCart}>
                <Trash2 className="h-4 w-4 mr-2" />
                Vaciar carrito
              </Button>
            </div>

            {items.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex gap-4">
                  <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                    <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {item.price.toFixed(2)}€ / {item.unit}
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border border-gray-300 rounded-lg">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.id, Number.parseInt(e.target.value) || 1)}
                          className="h-8 w-16 text-center border-0 focus-visible:ring-0"
                          min="1"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900">{(item.price * item.quantity).toFixed(2)}€</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Resumen del pedido</h2>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{total.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Envío</span>
                  <span className="text-green-600 font-medium">GRATIS</span>
                </div>
                <div className="border-t pt-3 flex justify-between text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span>{total.toFixed(2)}€</span>
                </div>
              </div>
              <Button className="w-full bg-orange-600 hover:bg-orange-700 h-12 text-lg" onClick={handleCheckout}>
                Proceder al pago
              </Button>
              <p className="text-xs text-gray-500 text-center mt-4">Entrega en menos de 48h</p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
