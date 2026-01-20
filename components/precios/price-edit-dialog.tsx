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
import type { PriceMaster } from "@/lib/services/price-service"
import { updatePrice } from "@/lib/services/price-service"
import { Loader2, TrendingUp, TrendingDown } from "lucide-react"
import { getCurrencySymbol, getUserCountry } from "@/lib/services/currency-service"

interface PriceEditDialogProps {
  price: PriceMaster
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function PriceEditDialog({ price, open, onOpenChange, onSuccess }: PriceEditDialogProps) {
  const [loading, setLoading] = useState(false)
  const [currencySymbol, setCurrencySymbol] = useState("€")
  const [formData, setFormData] = useState({
    subcategory: price.subcategory || "",
    description: price.description,
    final_price: price.final_price.toString(),
    color: price.color || "",
    brand: price.brand || "",
    model: price.model || "",
    notes: price.notes || "",
  })

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
      color: price.color || "",
      brand: price.brand || "",
      model: price.model || "",
      notes: price.notes || "",
    })
  }, [price])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const finalPrice = Number.parseFloat(formData.final_price) || 0

      // Calcular los costes proporcionalmente (70% mano de obra, 30% materiales)
      const laborCost = finalPrice * 0.7
      const materialCost = finalPrice * 0.3

      await updatePrice(price.id, {
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
        margin_percentage: 0, // Sin margen adicional, el precio final es el que el usuario especifica
      })

      console.log("[v0] Precio actualizado correctamente")
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("Error updating price:", error)
      alert(`Error al actualizar el precio: ${error instanceof Error ? error.message : "Error desconocido"}`)
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
              <span className="text-muted-foreground">Precio Maestro (se creará copia personalizada)</span>
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

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="Ej: Blanco"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand">Marca</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="Ej: Roca"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Modelo</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="Ej: Victoria"
              />
            </div>
          </div>

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
