"use client"

import { CommandInput } from "@/components/ui/command"

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Sparkles, Loader2, TrendingUp, TrendingDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import * as SubscriptionLimitsService from "@/lib/services/subscription-limits-service"
import { Badge } from "@/components/ui/badge"
import { AIPriceImportDialog } from "@/components/precios/ai-price-import-dialog"

interface CustomPrice {
  id: string
  code: string
  description: string
  long_description: string | null
  unit: string
  final_price: number
  subcategory: string | null
  category_id: string | null
}

const UNITS = ["Ud", "m²", "ml", "m³", "H", "PA"]

interface AddAdjustmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  adjustmentType: "addition" | "subtraction"
  budgetId: string
  onAdjustmentAdded: () => void
}

export function AddAdjustmentDialog({
  open,
  onOpenChange,
  adjustmentType,
  budgetId,
  onAdjustmentAdded,
}: AddAdjustmentDialogProps) {
  const [loading, setLoading] = useState(false)
  const [customPrices, setCustomPrices] = useState<CustomPrice[]>([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [generatingWithAI, setGeneratingWithAI] = useState(false)
  const [aiPrompt, setAiPrompt] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false)
  const [hasAiAccess, setHasAiAccess] = useState<boolean | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    async function checkAccess() {
      const limits = await SubscriptionLimitsService.getSubscriptionLimits()
      setHasAiAccess(limits?.aiPriceImport || false)
    }
    checkAccess()
  }, [])
  const [formData, setFormData] = useState({
    description: "",
    unit: "Ud",
    quantity: 1,
    unit_price: 0,
    notes: "",
    date: new Date().toISOString().split("T")[0], // Format: YYYY-MM-DD
  })

  useEffect(() => {
    if (open) {
      loadCustomPrices()
      resetForm()
    }
  }, [open])

  const loadCustomPrices = async () => {
    try {
      const supabase = await createClient()
      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (userError || !userData.user) {
        console.log("[v0] No user found for loading prices")
        return
      }

      const { data: userProfile } = await supabase
        .from("profiles")
        .select("country_code")
        .eq("id", userData.user.id)
        .single()

      const country = userProfile?.country_code?.toLowerCase() || "es"
      const priceTable = country === "es" ? "price_master" : `price_master_${country}`

      const { data, error } = await supabase
        .from(priceTable)
        .select("id, code, description, long_description, unit, final_price, subcategory, category_id")
        .eq("is_active", true)
        .order("description")
        .limit(500)

      if (error) {
        console.error("[v0] Error loading prices:", error)
        throw error
      }

      console.log("[v0] Precios cargados para ajustes:", data?.length || 0)
      setCustomPrices(data || [])
    } catch (err) {
      console.error("[v0] Error loading prices:", err)
      setCustomPrices([])
    }
  }

  const loadPriceFromList = (price: CustomPrice) => {
    setFormData({
      description: price.long_description || price.description || "",
      unit: price.unit,
      quantity: 1,
      unit_price: price.final_price,
      notes: "",
      date: new Date().toISOString().split("T")[0],
    })
    setSearchOpen(false)
    toast({
      title: "Precio cargado",
      description: "Los datos se han cargado desde tu lista de precios",
    })
  }

  const generateWithAI = async () => {
    if (!aiPrompt.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor describe el ajuste que quieres crear",
      })
      return
    }

    // Verificar límites antes de generar
    if (hasAiAccess === false) {
      setShowUpgradeDialog(true)
      return
    }

    try {
      setGeneratingWithAI(true)

      const response = await fetch("/api/ia/generate-line-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
      })

      if (!response.ok) throw new Error("Error al generar ajuste")

      const data = await response.json()

      setFormData({
        description: data.description || "",
        unit: data.unit || "Ud",
        quantity: data.quantity || 1,
        unit_price: data.unit_price || 0,
        notes: "",
        date: new Date().toISOString().split("T")[0],
      })

      toast({
        title: "Ajuste generado",
        description: "La IA ha generado el ajuste. Revisa y ajusta si es necesario.",
      })
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo generar el ajuste con IA",
      })
    } finally {
      setGeneratingWithAI(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.description || formData.unit_price <= 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor completa todos los campos obligatorios",
      })
      return
    }

    try {
      setLoading(true)
      console.log("[v0] Guardando ajuste en la base de datos...")
      console.log("[v0] Budget ID:", budgetId)
      console.log("[v0] Adjustment type:", adjustmentType)
      console.log("[v0] Form data:", formData)

      const supabase = createClient()

      const totalPrice = formData.quantity * formData.unit_price

      const adjustmentData = {
        budget_id: budgetId,
        type: adjustmentType,
        category: "Ajustes y Extras",
        concept: formData.description,
        description: formData.notes || undefined,
        unit: formData.unit,
        quantity: formData.quantity,
        unit_price: formData.unit_price,
        total_price: totalPrice, // Add calculated total_price
        adjustment_date: new Date(formData.date).toISOString(),
        notes: formData.notes || undefined,
      }

      console.log("[v0] Datos del ajuste a guardar:", adjustmentData)
      console.log("[v0] Total price calculado:", totalPrice)

      const { data, error } = await supabase.from("budget_adjustments").insert(adjustmentData).select().single()

      if (error) {
        console.error("[v0] Error al guardar ajuste:", error)
        throw error
      }

      console.log("[v0] Ajuste guardado exitosamente:", data)

      toast({
        title: "Ajuste guardado",
        description: `El ajuste se ha ${adjustmentType === "addition" ? "añadido" : "restado"} correctamente`,
      })

      onAdjustmentAdded()
      onOpenChange(false)
    } catch (err) {
      console.error("[v0] Error en handleSubmit:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description:
          "No se pudo guardar el ajuste. Asegúrate de que la tabla budget_adjustments existe en la base de datos.",
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      description: "",
      unit: "Ud",
      quantity: 1,
      unit_price: 0,
      notes: "",
      date: new Date().toISOString().split("T")[0],
    })
    setAiPrompt("")
    setSearchQuery("")
  }

  const filteredCustomPrices = customPrices.filter((price) => {
    if (!searchQuery.trim()) return true
    const searchTerm = searchQuery.toLowerCase()
    return (
      (price.description || "").toLowerCase().includes(searchTerm) ||
      (price.subcategory || "").toLowerCase().includes(searchTerm) ||
      (price.code || "").toLowerCase().includes(searchTerm)
    )
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {adjustmentType === "addition" ? (
              <>
                <TrendingUp className="h-5 w-5 text-green-600" />
                Añadir Partida Adicional
              </>
            ) : (
              <>
                <TrendingDown className="h-5 w-5 text-red-600" />
                Restar Partida
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {adjustmentType === "addition"
              ? "Añade una partida adicional al presupuesto aceptado"
              : "Resta una partida del presupuesto aceptado"}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="manual">Manual</TabsTrigger>
            <TabsTrigger value="from-list">Desde Mi Lista</TabsTrigger>
            <TabsTrigger value="ai" className="relative">
              Generar con IA
              {hasAiAccess === false && (
                <Badge
                  variant="secondary"
                  className="ml-1 bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-none py-0 px-2 h-4 text-[9px] font-bold"
                >
                  PRO
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="from-list" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date-list">Fecha del ajuste</Label>
              <Input
                id="date-list"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                max={new Date().toISOString().split("T")[0]}
              />
              <p className="text-xs text-muted-foreground">Indica la fecha en que se aceptó este ajuste</p>
            </div>

            <div className="space-y-2">
              <Label>Buscar en mi lista de precios</Label>
              {customPrices.length === 0 ? (
                <div className="rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950/20 p-4">
                  <p className="text-sm text-orange-700 dark:text-orange-300">No se encontraron precios disponibles</p>
                </div>
              ) : (
                <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Search className="h-4 w-4 mr-2" />
                      Buscar en {customPrices.length} precio{customPrices.length !== 1 ? "s" : ""}...
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[500px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Buscar precio..." value={searchQuery} onValueChange={setSearchQuery} />
                      <CommandList>
                        <CommandEmpty>No se encontraron precios</CommandEmpty>
                        <CommandGroup>
                          {filteredCustomPrices.map((price) => (
                            <CommandItem
                              key={price.id}
                              onSelect={() => loadPriceFromList(price)}
                              className="cursor-pointer group"
                            >
                              <div className="flex flex-col gap-1 flex-1">
                                <div className="flex items-center justify-between gap-4">
                                  <span className="font-medium flex-1">{price.subcategory || price.description}</span>
                                  <span className="text-sm text-muted-foreground group-data-[selected=true]:text-white whitespace-nowrap">
                                    {price.final_price.toFixed(2)} €/{price.unit}
                                  </span>
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description-list">
                Descripción <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description-list"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción detallada del ajuste..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit-list">Unidad</Label>
                <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
                  <SelectTrigger id="unit-list">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity-list">Cantidad</Label>
                <Input
                  id="quantity-list"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: Number.parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit_price-list">
                  Precio Unitario (€) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="unit_price-list"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formData.unit_price}
                  onChange={(e) => setFormData({ ...formData, unit_price: Number.parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes-list">Notas (opcional)</Label>
              <Textarea
                id="notes-list"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notas adicionales sobre este ajuste"
                rows={2}
              />
            </div>

            <div className="rounded-lg border p-4 bg-muted/50">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total del ajuste:</span>
                <span
                  className={`text-lg font-semibold ${adjustmentType === "addition" ? "text-green-600" : "text-red-600"}`}
                >
                  {adjustmentType === "addition" ? "+" : "-"}
                  {(formData.quantity * formData.unit_price).toFixed(2)} €
                </span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ai" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date-ai">Fecha del ajuste</Label>
              <Input
                id="date-ai"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                max={new Date().toISOString().split("T")[0]}
              />
              <p className="text-xs text-muted-foreground">Indica la fecha en que se aceptó este ajuste</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai-prompt">Describe el ajuste que necesitas</Label>
              <Textarea
                id="ai-prompt"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Ej: 5 enchufes adicionales en el salón"
                rows={4}
              />
              <Button onClick={generateWithAI} disabled={generatingWithAI} className="w-full">
                {generatingWithAI ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generar con IA
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description-ai">
                Descripción <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description-ai"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción detallada del ajuste..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit-ai">Unidad</Label>
                <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
                  <SelectTrigger id="unit-ai">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity-ai">Cantidad</Label>
                <Input
                  id="quantity-ai"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: Number.parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit_price-ai">
                  Precio Unitario (€) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="unit_price-ai"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formData.unit_price}
                  onChange={(e) => setFormData({ ...formData, unit_price: Number.parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes-ai">Notas (opcional)</Label>
              <Textarea
                id="notes-ai"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notas adicionales sobre este ajuste"
                rows={2}
              />
            </div>

            <div className="rounded-lg border p-4 bg-muted/50">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total del ajuste:</span>
                <span
                  className={`text-lg font-semibold ${adjustmentType === "addition" ? "text-green-600" : "text-red-600"}`}
                >
                  {adjustmentType === "addition" ? "+" : "-"}
                  {(formData.quantity * formData.unit_price).toFixed(2)} €
                </span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date-manual">Fecha del ajuste</Label>
              <Input
                id="date-manual"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                max={new Date().toISOString().split("T")[0]}
              />
              <p className="text-xs text-muted-foreground">Indica la fecha en que se aceptó este ajuste</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Descripción <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ej: 5 enchufes adicionales en el salón"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit">Unidad</Label>
                <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
                  <SelectTrigger id="unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Cantidad</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: Number.parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit_price">
                  Precio Unitario (€) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="unit_price"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formData.unit_price}
                  onChange={(e) => setFormData({ ...formData, unit_price: Number.parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notas adicionales sobre este ajuste"
                rows={2}
              />
            </div>

            <div className="rounded-lg border p-4 bg-muted/50">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total del ajuste:</span>
                <span
                  className={`text-lg font-semibold ${adjustmentType === "addition" ? "text-green-600" : "text-red-600"}`}
                >
                  {adjustmentType === "addition" ? "+" : "-"}
                  {(formData.quantity * formData.unit_price).toFixed(2)} €
                </span>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={loading}>
            {loading ? "Añadiendo..." : adjustmentType === "addition" ? "Añadir" : "Restar"}
          </Button>
        </DialogFooter>
      </DialogContent>
      <AIPriceImportDialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog} mode="generate" />
    </Dialog>
  )
}
