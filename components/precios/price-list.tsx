"use client"

import { useState, useEffect } from "react"
import { Search, Plus, Percent, X } from "lucide-react"
import {
  getPriceCategories,
  getPricesByCategory,
  searchPrices,
  deleteCustomPrice,
  increasePriceById,
  increaseAllPrices,
  increasePricesByCategory,
  type PriceCategory,
  type PriceMaster,
  type PriceWithCategory,
} from "@/lib/services/price-service"
import { PriceEditDialog } from "./price-edit-dialog"
import { PriceCreateDialog } from "./price-create-dialog"
import { PriceIncreaseDialog } from "./price-increase-dialog"
import { Button } from "@/components/ui/button"
import { CategoryManagerDialog } from "./category-manager-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { isMasterUser } from "@/lib/services/auth-service"
import { getUserCountryFromProfile } from "@/lib/services/currency-service"
import { PriceTable } from "./price-table"
import { AdminPriceEditor } from "./admin-price-editor" // Import AdminPriceEditor

export function PriceList() {
  const [categories, setCategories] = useState<PriceCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [prices, setPrices] = useState<PriceMaster[]>([])
  const [searchResults, setSearchResults] = useState<PriceWithCategory[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [editingPrice, setEditingPrice] = useState<PriceMaster | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [deletingPrice, setDeletingPrice] = useState<PriceMaster | null>(null)
  const [showGlobalIncreaseDialog, setShowGlobalIncreaseDialog] = useState(false)
  const [increasingCategory, setIncreasingCategory] = useState<string | null>(null)
  const [increasingPrice, setIncreasingPrice] = useState<PriceMaster | null>(null)
  const [isUpdatingAllPrices, setIsUpdatingAllPrices] = useState(false)
  const { toast } = useToast()
  const [currencySymbol, setCurrencySymbol] = useState("€")
  const [isMaster, setIsMaster] = useState(false)
  const [adminEditingPrice, setAdminEditingPrice] = useState<PriceMaster | null>(null)
  const [userCountry, setUserCountry] = useState<any>(null)

  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [isTouchScrolling, setIsTouchScrolling] = useState(false)
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  useEffect(() => {
    loadCategories()
    loadUserCountry()
    checkMasterStatus()
  }, [])

  useEffect(() => {
    if (selectedCategory && !searchQuery) {
      loadPrices(selectedCategory)
    }
  }, [selectedCategory, searchQuery])

  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch(searchQuery)
    } else {
      setSearchResults([])
      if (selectedCategory) {
        loadPrices(selectedCategory)
      }
    }
  }, [searchQuery])

  async function loadCategories() {
    try {
      const data = await getPriceCategories()
      setCategories(data)
      if (data.length > 0) {
        setSelectedCategory(data[0].id)
      }
    } catch (error) {
      console.error("Error loading categories:", error)
    } finally {
      setLoading(false)
    }
  }

  async function loadPrices(categoryId: string) {
    try {
      setLoading(true)
      const data = await getPricesByCategory(categoryId)
      console.log(
        "[v0] Precios cargados:",
        data.length,
        "personalizados:",
        data.filter((p) => p.is_custom).length,
        "importados:",
        data.filter((p) => p.is_imported).length,
      )
      setPrices(data)
    } catch (error) {
      console.error("Error loading prices:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSearch(query: string) {
    try {
      setLoading(true)
      console.log("[v0] Buscando con query:", query)
      const results = await searchPrices(query)
      console.log(
        "[v0] Resultados recibidos:",
        results.length,
        results.map((r) => r.subcategory || r.description),
      )
      setSearchResults(results)
    } catch (error) {
      console.error("Error searching prices:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDeletePrice(price: PriceMaster) {
    try {
      await deleteCustomPrice(price.id)
      toast({
        title: "Precio eliminado",
        description: "El precio personalizado ha sido eliminado correctamente.",
      })

      setDeletingPrice(null)

      if (searchQuery) {
        await handleSearch(searchQuery)
      } else {
        await loadPrices(selectedCategory)
      }
    } catch (error) {
      console.error("Error deleting price:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el precio. Inténtalo de nuevo.",
        variant: "destructive",
      })
      setDeletingPrice(null)
    }
  }

  async function handleIncreaseCategory(categoryId: string, percentage: number) {
    try {
      const count = await increasePricesByCategory(categoryId, percentage)
      toast({
        title: "Precios actualizados",
        description: `Se han ajustado ${count} precio${count !== 1 ? "s" : ""} en un ${percentage > 0 ? "+" : ""}${percentage}%`,
      })
      loadPrices(categoryId)
    } catch (error) {
      console.error("Error increasing prices:", error)
      toast({
        title: "Error",
        description: "No se pudieron actualizar los precios. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIncreasingCategory(null)
    }
  }

  async function handleIncreasePrice(priceId: string, percentage: number) {
    try {
      await increasePriceById(priceId, percentage)
      toast({
        title: "Precio actualizado",
        description: `El precio ha sido ajustado en un ${percentage > 0 ? "+" : ""}${percentage}%`,
      })

      if (searchQuery) {
        handleSearch(searchQuery)
      } else {
        loadPrices(selectedCategory)
      }
    } catch (error) {
      console.error("Error increasing price:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el precio. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIncreasingPrice(null)
    }
  }

  async function handleIncreaseAllPrices(percentage: number) {
    console.log("[v0] 🎯 handleIncreaseAllPrices llamado con porcentaje:", percentage)

    setIsUpdatingAllPrices(true)
    setShowGlobalIncreaseDialog(false)

    try {
      console.log("[v0] 📞 Llamando a increaseAllPrices del servicio...")
      const count = await increaseAllPrices(percentage)
      console.log("[v0] ✅ increaseAllPrices completado. Precios afectados:", count)

      toast({
        title: "Precios actualizados",
        description: `Se han ajustado ${count} precio${count !== 1 ? "s" : ""} en un ${percentage > 0 ? "+" : ""}${percentage}%`,
      })
      if (selectedCategory) {
        console.log("[v0] 🔄 Recargando precios de la categoría:", selectedCategory)
        loadPrices(selectedCategory)
      }
    } catch (error) {
      console.error("[v0] ❌ Error increasing all prices:", error)
      toast({
        title: "Error",
        description: "No se pudieron actualizar los precios. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      console.log("[v0] ✅ Finalizando handleIncreaseAllPrices")
      setIsUpdatingAllPrices(false)
    }
  }

  async function handleQuickIncrease5Percent(priceId: string) {
    try {
      await increasePriceById(priceId, 5)
      toast({
        title: "Precio actualizado",
        description: "El precio ha sido incrementado en un +5%",
      })

      if (searchQuery) {
        handleSearch(searchQuery)
      } else {
        loadPrices(selectedCategory)
      }
    } catch (error) {
      console.error("Error increasing price:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el precio. Inténtalo de nuevo.",
        variant: "destructive",
      })
    }
  }

  async function checkMasterStatus() {
    const isMasterUser_ = await isMasterUser()
    setIsMaster(isMasterUser_)
  }

  async function loadUserCountry() {
    try {
      const country = await getUserCountryFromProfile()
      setUserCountry(country)
      setCurrencySymbol(country.currency.symbol)
      console.log("[v0] País cargado para moneda:", country.code, "->", country.currency.symbol)
    } catch (error) {
      console.error("[v0] Error al cargar país del usuario:", error)
      setCurrencySymbol("€") // Por defecto Euro
    }
  }

  const sourcePrices = searchQuery ? searchResults : prices

  const groupedSearchResults = searchResults.reduce(
    (acc, price) => {
      const categoryId = price.category?.id || price.category_id
      if (!acc[categoryId]) {
        acc[categoryId] = []
      }
      acc[categoryId].push(price)
      return acc
    },
    {} as Record<string, PriceWithCategory[]>,
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && deletingPrice) {
        e.preventDefault()
        handleDeletePrice(deletingPrice)
      }
    }

    if (deletingPrice) {
      window.addEventListener("keydown", handleKeyDown)
      return () => window.removeEventListener("keydown", handleKeyDown)
    }
  }, [deletingPrice])

  return (
    <div className="w-full space-y-0 md:space-y-4">
      <div className="md:hidden px-2 py-2 border-b flex items-center justify-between gap-2">
        <button
          onClick={() => setIsSearchExpanded(!isSearchExpanded)}
          className="flex items-center justify-center w-8 h-8 rounded-lg border bg-background hover:bg-muted shrink-0"
        >
          <Search className="h-4 w-4 text-muted-foreground" />
        </button>

        {isSearchExpanded && (
          <div className="absolute left-2 right-2 top-12 z-20 flex items-center gap-2 bg-background border rounded-lg p-2 shadow-lg">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar precios..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-sm"
              autoFocus
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="p-1 hover:bg-muted rounded">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={() => {
                setSearchQuery("")
                setIsSearchExpanded(false)
              }}
              className="p-1 hover:bg-muted rounded"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <button
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="hidden md:flex items-center gap-4 px-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar precios..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
            <span>Personalizados</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-600" />
            <span>Importados</span>
          </div>
        </div>

        <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Crear Precio
        </Button>

        <Button onClick={() => setShowCategoryManager(true)} variant="outline" className="gap-2">
          Categorías
        </Button>

        {isMaster && (
          <Button onClick={() => setShowGlobalIncreaseDialog(true)} variant="outline" className="gap-2">
            <Percent className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="relative w-full border-b">
        {/* Gradientes para indicar scroll */}
        <div className="md:hidden absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none z-10" />
        <div className="md:hidden absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />

        <div className="overflow-x-auto scrollbar-hide px-0 md:px-6">
          <div className="flex items-center gap-0 min-w-max">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`
                  px-3 md:px-6 py-2.5 md:py-4 text-xs md:text-sm font-medium whitespace-nowrap transition-colors border-b-2 shrink-0
                  ${selectedCategory === category.id
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }
                `}
              >
                {category.name.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {searchQuery ? (
        <div className="px-3 sm:px-6 space-y-6">
          {Object.entries(groupedSearchResults).map(([categoryId, categoryPrices]) => {
            const category = categories.find((c) => c.id === categoryId)
            if (!category) return null

            return (
              <div key={categoryId} className="space-y-3">
                <h2 className="text-sm sm:text-base font-semibold uppercase tracking-wide">{category.name}</h2>
                <PriceTable
                  prices={categoryPrices}
                  currencySymbol={currencySymbol}
                  onEdit={setEditingPrice}
                  onDelete={setDeletingPrice}
                  onIncrease={setIncreasingPrice}
                  isMaster={isMaster}
                  onAdminEdit={setAdminEditingPrice}
                  hideCode={true}
                />
              </div>
            )
          })}
        </div>
      ) : (
        <div className="px-3 sm:px-6 mt-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <PriceTable
              prices={prices}
              currencySymbol={currencySymbol}
              onEdit={setEditingPrice}
              onDelete={setDeletingPrice}
              onIncrease={setIncreasingPrice}
              isMaster={isMaster}
              onAdminEdit={setAdminEditingPrice}
            />
          )}
        </div>
      )}

      {adminEditingPrice && (
        <AdminPriceEditor
          open={!!adminEditingPrice}
          onOpenChange={(open) => !open && setAdminEditingPrice(null)}
          price={adminEditingPrice}
        />
      )}

      {showGlobalIncreaseDialog && (
        <PriceIncreaseDialog
          open={showGlobalIncreaseDialog}
          onOpenChange={setShowGlobalIncreaseDialog}
          onConfirm={handleIncreaseAllPrices}
          title="Aumentador Global de Precios"
          description="Ajusta todos los precios de todas las categorías por un porcentaje. Usa valores positivos para aumentar o negativos para reducir."
        />
      )}

      {increasingCategory && (
        <PriceIncreaseDialog
          open={!!increasingCategory}
          onOpenChange={(open) => !open && setIncreasingCategory(null)}
          onConfirm={(percentage) => handleIncreaseCategory(increasingCategory, percentage)}
          title="Ajustar Precios de Categoría"
          description={`Ajusta todos los precios de la categoría ${categories.find((c) => c.id === increasingCategory)?.name} por un porcentaje.`}
        />
      )}

      {increasingPrice && (
        <PriceIncreaseDialog
          open={!!increasingPrice}
          onOpenChange={(open) => !open && setIncreasingPrice(null)}
          onConfirm={(percentage) => handleIncreasePrice(increasingPrice.id, percentage)}
          title="Ajustar Precio Individual"
          description={`Ajusta el precio de "${increasingPrice.subcategory}" por un porcentaje.`}
        />
      )}

      {editingPrice && (
        <PriceEditDialog
          price={editingPrice}
          open={!!editingPrice}
          onOpenChange={(open) => !open && setEditingPrice(null)}
          onSuccess={() => {
            if (searchQuery) {
              handleSearch(searchQuery)
            } else {
              loadPrices(selectedCategory)
            }
            setEditingPrice(null)
          }}
        />
      )}

      {showCreateDialog && (
        <PriceCreateDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          categories={categories}
          onSuccess={(createdCategoryId?: string) => {
            // Si se creó en una categoría específica, cambiar a ella
            if (createdCategoryId && createdCategoryId !== selectedCategory) {
              setSelectedCategory(createdCategoryId)
            }
            if (searchQuery) {
              handleSearch(searchQuery)
            } else {
              loadPrices(createdCategoryId || selectedCategory)
            }
            setShowCreateDialog(false)
          }}
        />
      )}

      {showCategoryManager && (
        <CategoryManagerDialog
          open={showCategoryManager}
          onOpenChange={setShowCategoryManager}
          onCategoriesChange={() => {
            loadCategories()
            if (selectedCategory) {
              loadPrices(selectedCategory)
            }
          }}
        />
      )}

      <AlertDialog open={!!deletingPrice} onOpenChange={(open) => !open && setDeletingPrice(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar precio personalizado?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El precio "{deletingPrice?.description}" será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingPrice && handleDeletePrice(deletingPrice)}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
