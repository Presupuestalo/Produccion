"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, ShoppingCart, Package, ExternalLink, Star, Filter, Loader2 } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { useCart } from "@/lib/hooks/use-cart"

interface Product {
  id: string
  asin: string
  name: string
  description: string
  price: number
  category: string
  subcategory: string
  image_url: string
  affiliate_url: string
  rating: number
  reviews_count: number
  brand: string
  tags: string[]
}

interface Category {
  id: string
  name: string
  count: number
}

export default function TiendaPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const { itemCount } = useCart()

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [selectedCategory, searchQuery])

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/tienda/categories")
      const data = await response.json()
      setCategories([{ id: "all", name: "Todos los productos", count: 0 }, ...(data.categories || [])])
    } catch (error) {
      console.error("[v0] Error fetching categories:", error)
    }
  }

  const fetchProducts = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        limit: "50",
        offset: "0",
      })

      if (selectedCategory !== "all") {
        params.append("category", selectedCategory)
      }

      if (searchQuery) {
        params.append("search", searchQuery)
      }

      const response = await fetch(`/api/tienda/products?${params}`)
      const data = await response.json()

      setProducts(data.products || [])
      setTotal(data.total || 0)
    } catch (error) {
      console.error("[v0] Error fetching products:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Tienda Amazon Afiliados</h1>
            <p className="text-gray-600">Miles de productos para tu reforma - Compra en Amazon con envío rápido</p>
          </div>
          <Link href="/dashboard/tienda/carrito">
            <Button className="bg-orange-600 hover:bg-orange-700 relative">
              <ShoppingCart className="h-5 w-5 mr-2" />
              Carrito
              {itemCount > 0 && <Badge className="absolute -top-2 -right-2 bg-red-500 text-white">{itemCount}</Badge>}
            </Button>
          </Link>
        </div>

        {/* Benefits Bar */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="p-4 flex items-center gap-3 bg-orange-50 border-orange-200">
            <Package className="h-8 w-8 text-orange-600" />
            <div>
              <div className="font-semibold text-gray-900">Amazon Prime</div>
              <div className="text-sm text-gray-600">Envío rápido disponible</div>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-3 bg-blue-50 border-blue-200">
            <Star className="h-8 w-8 text-blue-600" />
            <div>
              <div className="font-semibold text-gray-900">Productos verificados</div>
              <div className="text-sm text-gray-600">Valoraciones reales</div>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-3 bg-green-50 border-green-200">
            <ExternalLink className="h-8 w-8 text-green-600" />
            <div>
              <div className="font-semibold text-gray-900">Compra segura</div>
              <div className="text-sm text-gray-600">Garantía Amazon</div>
            </div>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Buscar productos, marcas, categorías..."
              className="pl-10 h-12 text-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-5 w-5 text-gray-500" />
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                className={
                  selectedCategory === category.id
                    ? "bg-orange-600 hover:bg-orange-700"
                    : "hover:bg-orange-50 hover:border-orange-300 bg-transparent"
                }
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
                {category.count > 0 && <Badge className="ml-2 bg-gray-200 text-gray-700">{category.count}</Badge>}
              </Button>
            ))}
          </div>

          {total > 0 && (
            <p className="text-sm text-gray-600">
              Mostrando {products.length} de {total} productos
            </p>
          )}
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-orange-600" />
          </div>
        ) : products.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No se encontraron productos</h3>
            <p className="text-gray-600 mb-4">
              Intenta con otra búsqueda o categoría, o ejecuta el script de seed para añadir productos.
            </p>
            <Button onClick={() => window.location.reload()} className="bg-orange-600 hover:bg-orange-700">
              Recargar página
            </Button>
          </Card>
        ) : (
          <div className="grid md:grid-cols-4 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-gray-100 flex items-center justify-center relative">
                  <img
                    src={product.image_url || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-full object-contain p-4"
                  />
                  {product.rating >= 4.5 && (
                    <Badge className="absolute top-2 left-2 bg-yellow-500 text-white">
                      <Star className="h-3 w-3 mr-1 fill-white" />
                      Top rated
                    </Badge>
                  )}
                </div>
                <div className="p-4">
                  <Badge className="mb-2 bg-orange-100 text-orange-700">{product.brand}</Badge>
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[3rem]">{product.name}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor(product.rating)
                              ? "fill-yellow-400 text-yellow-400"
                              : "fill-gray-200 text-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      {product.rating} ({product.reviews_count})
                    </span>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-2xl font-bold text-orange-600">{product.price.toFixed(2)}€</span>
                    </div>
                  </div>

                  <a href={product.affiliate_url} target="_blank" rel="noopener noreferrer" className="block">
                    <Button className="w-full bg-orange-600 hover:bg-orange-700">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ver en Amazon
                    </Button>
                  </a>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
