"use client"

import type React from "react"

import React, { useState, useEffect } from "react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createCustomPrice, type PriceCategory } from "@/lib/services/price-service"
import { Loader2, Sparkles } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import * as SubscriptionLimitsService from "@/lib/services/subscription-limits-service"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { isMasterUser } from "@/lib/services/auth-service"
import { AIPriceImportDialog } from "./ai-price-import-dialog"

interface PriceCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: PriceCategory[]
  onSuccess: (categoryId?: string) => void
}

export function PriceCreateDialog({ open, onOpenChange, categories, onSuccess }: PriceCreateDialogProps) {
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiPrompt, setAiPrompt] = useState("")
  const [showAiInput, setShowAiInput] = useState(false)
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false)
  const [hasAiAccess, setHasAiAccess] = useState<boolean | null>(null)
  const [isMaster, setIsMaster] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    async function checkAccess() {
      const limits = await SubscriptionLimitsService.getSubscriptionLimits()
      setHasAiAccess(limits?.aiPriceImport || false)

      const masterStatus = await isMasterUser()
      setIsMaster(masterStatus)
    }
    checkAccess()
  }, [])
  const [formData, setFormData] = useState({
    category_id: categories[0]?.id || "",
    subcategory: "",
    description: "",
    unit: "Ud",
    final_price: "",
    color: "",
    brand: "",
    model: "",
  })

  function capitalizeFirstLetter(text: string): string {
    if (!text) return text
    return text.charAt(0).toUpperCase() + text.slice(1)
  }

  async function handleGenerateWithAI() {
    if (!aiPrompt.trim()) {
      alert("Por favor, describe el trabajo que quieres presupuestar")
      return
    }

    // Verificar límites antes de generar
    const limits = await SubscriptionLimitsService.getSubscriptionLimits()
    if (!limits?.aiPriceImport) {
      setShowUpgradeDialog(true)
      return
    }

    setAiLoading(true)
    try {
      const response = await fetch("/api/generate-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt,
          categories: categories.map((c) => ({ id: c.id, name: c.name })),
        }),
      })

      if (!response.ok) {
        throw new Error("Error al generar el precio")
      }

      const data = await response.json()

      setFormData({
        category_id: data.category || categories[0]?.id || "",
        subcategory: data.subcategory || "",
        description: data.description || "",
        unit: data.unit || "Ud",
        final_price: data.final_price?.toString() || "",
        color: data.color || "",
        brand: data.brand || "",
        model: data.model || "",
      })

      setShowAiInput(false)
      setAiPrompt("")
    } catch (error) {
      console.error("Error generating with AI:", error)
      alert("Error al generar el precio con IA. Por favor, intenta de nuevo.")
    } finally {
      setAiLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const timestamp = Date.now().toString().slice(-6)
      const categoryPrefix =
        categories
          .find((c) => c.id === formData.category_id)
          ?.name.substring(0, 3)
          .toUpperCase() || "CUS"
      const autoCode = `${categoryPrefix}-${timestamp}`

      const finalPrice = Number.parseFloat(formData.final_price) || 0

      console.log("[v0] Creando precio personalizado en categoría:", formData.category_id)

      await createCustomPrice({
        code: autoCode,
        category_id: formData.category_id,
        subcategory: formData.subcategory.toUpperCase(),
        description: capitalizeFirstLetter(formData.description),
        long_description: null,
        unit: formData.unit,
        labor_cost: 0,
        material_cost: 0,
        equipment_cost: 0,
        other_cost: finalPrice,
        margin_percentage: 0,
        is_active: true,
        is_custom: true,
        is_imported: false,
        notes: null,
        color: formData.color || null,
        brand: formData.brand || null,
        model: formData.model || null,
      })

      console.log("[v0] Precio creado exitosamente")

      const createdCategoryId = formData.category_id

      setFormData({
        category_id: categories[0]?.id || "",
        subcategory: "",
        description: "",
        unit: "Ud",
        final_price: "",
        color: "",
        brand: "",
        model: "",
      })

      onSuccess(createdCategoryId)
      onOpenChange(false)
    } catch (error) {
      console.error("Error creating price:", error)
      alert("Error al crear el precio")
    } finally {
      setLoading(false)
    }
  }

  const isMaterialsCategory = formData.category_id === "MATERIALES"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Precio Personalizado</DialogTitle>
          <DialogDescription>Crea un nuevo precio personalizado para tu empresa</DialogDescription>
        </DialogHeader>

        {isMaster && (
          <div className="space-y-3">
            <Alert className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <AlertDescription className="text-sm text-gray-700">
                <strong className="text-purple-700">Genera precios con IA:</strong>
                <p className="mt-1">
                  Describe el trabajo en lenguaje natural y la IA determinará automáticamente la categoría, concepto,
                  descripción y precio aproximado.
                </p>
              </AlertDescription>
            </Alert>

            {!showAiInput ? (
              <Button
                type="button"
                variant="outline"
                className="w-full border-purple-200 hover:bg-purple-50 bg-transparent flex items-center justify-center gap-2"
                onClick={() => {
                  if (hasAiAccess) {
                    setShowAiInput(true)
                  } else {
                    setShowUpgradeDialog(true)
                  }
                }}
              >
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Generar con IA</span>
                {hasAiAccess === false && (
                  <Badge variant="secondary" className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-none py-0 px-2 h-5 text-[10px] font-bold">PRO</Badge>
                )}
              </Button>
            ) : (
              <div className="space-y-2 p-4 border border-purple-200 rounded-lg bg-purple-50/50">
                <Label htmlFor="ai-prompt" className="text-purple-900">
                  Describe el trabajo a presupuestar
                </Label>
                <Textarea
                  id="ai-prompt"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Ej: Quiero hacer un precio para colocar una hornacina en el baño"
                  rows={2}
                  className="bg-white"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleGenerateWithAI}
                    disabled={aiLoading}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {aiLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowAiInput(false)
                      setAiPrompt("")
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">Categoría *</Label>
            <Select
              value={formData.category_id}
              onValueChange={(value) => setFormData({ ...formData, category_id: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subcategory">Concepto *</Label>
            <Input
              id="subcategory"
              value={formData.subcategory}
              onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
              placeholder="Ej: INSTALACIÓN ESPECIAL"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripción detallada del trabajo a realizar..."
              rows={3}
              required
            />
          </div>

          {isMaterialsCategory && (
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
          )}

          <div className="grid grid-cols-2 gap-4">
            {!isMaterialsCategory && (
              <div className="space-y-2">
                <Label htmlFor="unit">Unidad *</Label>
                <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ud">Ud (Unidad)</SelectItem>
                    <SelectItem value="m²">m² (Metro cuadrado)</SelectItem>
                    <SelectItem value="ml">ml (Metro lineal)</SelectItem>
                    <SelectItem value="m³">m³ (Metro cúbico)</SelectItem>
                    <SelectItem value="kg">kg (Kilogramo)</SelectItem>
                    <SelectItem value="H">H (Hora)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className={`space-y-2 ${isMaterialsCategory ? "col-span-2" : ""}`}>
              <Label htmlFor="final_price">Precio (€) *</Label>
              <Input
                id="final_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.final_price}
                onChange={(e) => setFormData({ ...formData, final_price: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Crear Precio
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      <AIPriceImportDialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog} mode="generate" />
    </Dialog>
  )
}
