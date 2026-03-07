"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { PriceMaster, PriceTier } from "@/lib/services/price-service"
import { updatePrice, getTiersForPrice, saveTiersForPrice, getPricesByCodes } from "@/lib/services/price-service"
import { Loader2, TrendingUp, TrendingDown, Sparkles } from "lucide-react"
import { getCurrencySymbol, getUserCountry } from "@/lib/services/currency-service"
import { PriceTiersEditor } from "./price-tiers-editor"

interface PriceEditDialogProps {
  price: PriceMaster
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  isAdmin?: boolean
}

const LINKED_FLOORING_CODES = ["10-M-09", "10-M-11", "10-M-12"]

export function PriceEditDialog({ price, open, onOpenChange, onSuccess, isAdmin = false }: PriceEditDialogProps) {
  const [loading, setLoading] = useState(false)
  const [currencySymbol, setCurrencySymbol] = useState("€")
  const [tiers, setTiers] = useState<PriceTier[]>([])
  const [formData, setFormData] = useState({
    subcategory: price.subcategory || "",
    description: price.description,
    final_price: price.final_price.toString(),
    waste_percentage: price.waste_percentage !== undefined && price.waste_percentage !== null ? price.waste_percentage.toString() : "",
    color: price.color || "",
    brand: price.brand || "",
    model: price.model || "",
    notes: price.notes || "",
  })

  // State for linked prices linking (Flooring -> Underlay & Baseboard)
  const [linkedPrices, setLinkedPrices] = useState<PriceMaster[]>([])
  const [showLinkingInfo, setShowLinkingInfo] = useState(false)
  const [linkedWaste, setLinkedWaste] = useState<Record<string, string>>({})
  const [applyingToLinked, setApplyingToLinked] = useState(false)

  useEffect(() => {
    async function loadCurrency() {
      const country = await getUserCountry()
      setCurrencySymbol(getCurrencySymbol(country))
    }
    loadCurrency()
  }, [])

  useEffect(() => {
    setFormData({
      subcategory: price.subcategory || "",
      description: price.description,
      final_price: price.final_price.toString(),
      waste_percentage: price.waste_percentage !== undefined && price.waste_percentage !== null ? price.waste_percentage.toString() : "",
      color: price.color || "",
      brand: price.brand || "",
      model: price.model || "",
      notes: price.notes || "",
    })
    // Load tiers for this price
    const isUserPrice = price.is_custom || price.is_imported
    getTiersForPrice(price.id, isUserPrice).then(setTiers).catch(() => setTiers([]))

    // Check if this is a flooring item that should trigger linking
    if (LINKED_FLOORING_CODES.includes(price.code)) {
      setShowLinkingInfo(true)
      const otherCodes = LINKED_FLOORING_CODES.filter(c => c !== price.code)
      getPricesByCodes(otherCodes).then(prices => {
        setLinkedPrices(prices)
        const initialWaste: Record<string, string> = {}
        prices.forEach(p => {
          initialWaste[p.code] = (p.waste_percentage !== undefined && p.waste_percentage !== null) ? p.waste_percentage.toString() : ""
        })
        setLinkedWaste(initialWaste)
      })
    } else {
      setShowLinkingInfo(false)
      setLinkedPrices([])
    }
  }, [price])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const finalPrice = Number.parseFloat(formData.final_price) || 0

      // Calcular los costes proporcionalmente (70% mano de obra, 30% materiales)
      const laborCost = finalPrice * 0.7
      const materialCost = finalPrice * 0.3

      const finalWastePercentage = formData.waste_percentage ? Number.parseFloat(formData.waste_percentage) : 0

      const updatedPrice = await updatePrice(price.id, {
        subcategory: formData.subcategory || null,
        description: formData.description,
        color: formData.color || null,
        brand: formData.brand || null,
        model: formData.model || null,
        notes: formData.notes || null,
        labor_cost: laborCost,
        material_cost: materialCost,
        equipment_cost: 0,
        other_cost: 0,
        margin_percentage: 0,
        waste_percentage: finalWastePercentage,
      })

      // Update linked prices if applicable
      if (LINKED_FLOORING_CODES.includes(price.code) && applyingToLinked) {
        for (const linkedPrice of linkedPrices) {
          const wasteStr = linkedWaste[linkedPrice.code]
          const wasteVal = wasteStr ? Number.parseFloat(wasteStr) : 0

          await updatePrice(linkedPrice.id, {
            waste_percentage: wasteVal
          })
        }
      }

      // Save tiers against the resulting price ID
      const savedPriceId = updatedPrice?.id || price.id
      // If the resulting price has a user_id, it is a user-specific price (customization)
      // If user_id is null, it is a master price (updated or created by admin)
      const isActuallyUserPrice = !!updatedPrice.user_id

      await saveTiersForPrice(savedPriceId, isActuallyUserPrice, tiers)

      console.log("[v0] Precio actualizado correctamente")
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("CRITICAL: Error updating price:", error)

      let errorMessage = "Error desconocido"

      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'object' && error !== null) {
        // Try various common error properties
        errorMessage = (error as any).message || (error as any).error_description || (error as any).msg || JSON.stringify(error)
      } else if (typeof error === 'string') {
        errorMessage = error
      }

      alert(`Error al actualizar el precio:\n\n${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  function adjustPrice(percentage: number) {
    const currentPrice = Number.parseFloat(formData.final_price) || 0
    const newPrice = currentPrice * (1 + percentage / 100)
    setFormData({ ...formData, final_price: newPrice.toFixed(2) })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Precio</DialogTitle>
          <DialogDescription>
            {price.is_custom && !price.is_imported && <span className="text-blue-500">Precio Personalizado</span>}
            {price.is_imported && <span className="text-purple-500">Precio Importado</span>}
            {!price.is_custom && !price.is_imported && (
              <span className="text-muted-foreground">
                {isAdmin ? "Editando Precio Maestro (Cambio Global)" : "Precio Maestro (se creará copia personalizada)"}
              </span>
            )}
            {" | "}Unidad: {price.unit}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subcategory">Concepto</Label>
            <Input
              id="subcategory"
              value={formData.subcategory}
              onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
              placeholder="Ej: Derribo de tabique"
              readOnly
              className="bg-muted"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              placeholder="Ej: Tabiques de placa de yeso laminado, incluye aislamiento..."
              className="text-sm"
            />
            <p className="text-xs text-gray-500">
              Las notas aparecerán en los presupuestos y PDFs para dar contexto adicional al cliente.
            </p>
          </div>

          {/* Sección de Características y Merma */}
          {((price.code.startsWith("10-") && (price.unit === "m²" || price.unit === "ml")) ||
            formData.color ||
            formData.brand ||
            formData.model) && (
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Características y Desperdicio</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                  {(price.unit === "m²" || price.unit === "ml") && price.code.startsWith("10-") && (
                    <div className="space-y-1.5">
                      <Label htmlFor="waste_percentage" className="text-[11px] uppercase tracking-wider text-gray-500">% Desperdicio</Label>
                      <div className="relative">
                        <Input
                          id="waste_percentage"
                          type="number"
                          step="0.1"
                          min="0"
                          placeholder="0"
                          value={formData.waste_percentage}
                          onChange={(e) => setFormData({ ...formData, waste_percentage: e.target.value })}
                          className="h-9 pr-7 text-sm border-amber-100 focus:border-amber-300 focus:ring-amber-100"
                        />
                        <span className="absolute right-2.5 top-2 text-xs font-medium text-amber-600">%</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="color" className="text-[11px] uppercase tracking-wider text-gray-500">Color</Label>
                    <Input
                      id="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      placeholder="Blanco"
                      className="h-9 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="brand" className="text-[11px] uppercase tracking-wider text-gray-500">Marca</Label>
                    <Input
                      id="brand"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      placeholder="Ej: Roca"
                      className="h-9 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="model" className="text-[11px] uppercase tracking-wider text-gray-500">Modelo</Label>
                    <Input
                      id="model"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      placeholder="Ej: Victoria"
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

          {/* Vinculación de Desperdicio (Solo para Parquet Flotante) */}
          {showLinkingInfo && linkedPrices.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-blue-100 bg-blue-50/30 p-4 rounded-xl border border-blue-100/50">
              <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
                <Sparkles className="w-4 h-4 text-blue-500" />
                <span>Vinculación de Desperdicio</span>
              </div>

              <p className="text-xs text-blue-600/80 leading-relaxed">
                Este material suele ir acompañado de {
                  price.code === "10-M-09" ? "**base aislante** y **rodapié**" :
                    price.code === "10-M-11" ? "**parquet flotante** y **rodapié**" :
                      "**parquet flotante** y **base aislante**"
                }.
                ¿Deseas aplicarles también un margen de desperdicio?
              </p>

              <div className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  id="apply_to_linked"
                  title="Aplicar a elementos vinculados"
                  checked={applyingToLinked}
                  onChange={(e) => setApplyingToLinked(e.target.checked)}
                  className="rounded border-blue-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <Label htmlFor="apply_to_linked" className="text-sm font-medium text-blue-800 cursor-pointer">
                  Sí, aplicar desperdicio a elementos vinculados
                </Label>
              </div>

              {applyingToLinked && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  {linkedPrices.map(linked => (
                    <div key={linked.code} className="space-y-1.5 p-2 bg-white rounded-lg border border-blue-100 shadow-sm">
                      <Label className="text-[10px] uppercase font-bold text-blue-900/60 block truncate">
                        {linked.subcategory || linked.code}
                      </Label>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          value={linkedWaste[linked.code] || ""}
                          onChange={(e) => setLinkedWaste({
                            ...linkedWaste,
                            [linked.code]: e.target.value
                          })}
                          className="h-8 pr-7 text-xs border-blue-200 focus:border-blue-400 focus:ring-blue-100"
                          placeholder="0"
                        />
                        <span className="absolute right-2 top-1.5 text-[10px] font-bold text-blue-400">%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="final_price">Precio ({currencySymbol})</Label>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => adjustPrice(-5)}
                  className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                  title="Reducir -5%"
                >
                  <TrendingDown className="w-3.5 h-3.5 mr-1" />
                  -5%
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => adjustPrice(5)}
                  className="h-7 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                  title="Aumentar +5%"
                >
                  <TrendingUp className="w-3.5 h-3.5 mr-1" />
                  +5%
                </Button>
              </div>
            </div>
            <Input
              id="final_price"
              type="number"
              step="0.01"
              value={formData.final_price}
              onChange={(e) => setFormData({ ...formData, final_price: e.target.value })}
              required
            />
          </div>

          {/* Franjas de precio */}
          <PriceTiersEditor
            tiers={tiers}
            unit={price.unit}
            currencySymbol={currencySymbol}
            onChange={setTiers}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
