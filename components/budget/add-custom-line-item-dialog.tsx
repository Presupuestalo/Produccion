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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Search, Sparkles, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { BudgetService } from "@/lib/services/budget-service"
import type { BudgetLineItem } from "@/lib/types/budget"
import { createClient } from "@/lib/supabase/client"
import { isMasterUser } from "@/lib/services/auth-service"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import * as SubscriptionLimitsService from "@/lib/services/subscription-limits-service"
import { Badge } from "@/components/ui/badge"
import { AIPriceImportDialog } from "@/components/precios/ai-price-import-dialog"
import { formatNumber } from "@/lib/utils/format"

interface AddCustomLineItemDialogProps {
  budgetId: string
  onItemAdded: () => void
  isOwner?: boolean // Añadir prop para identificar propietarios
}

const CATEGORIES = [
  "DERRIBOS",
  "ALBAÑILERÍA",
  "TABIQUES Y TRASDOSADOS",
  "TABIQUERÍA",
  "FONTANERÍA",
  "CARPINTERÍA",
  "ELECTRICIDAD",
  "CALEFACCIÓN",
  "PINTURA",
  "LIMPIEZA",
  "MATERIALES",
]

const CATEGORY_MAPPING: Record<string, string> = {
  DERRIBOS: "DERRIBOS",
  "01. DERRIBOS": "DERRIBOS",
  ALBAÑILERÍA: "ALBAÑILERÍA",
  ALBAÑILERIA: "ALBAÑILERÍA",
  "02. ALBAÑILERÍA": "ALBAÑILERÍA",
  "02. ALBAÑILERIA": "ALBAÑILERÍA",
  "TABIQUES Y TRASDOSADOS": "TABIQUES Y TRASDOSADOS",
  "03. TABIQUES Y TRASDOSADOS": "TABIQUES Y TRASDOSADOS",
  TABIQUERÍA: "TABIQUERÍA",
  TABIQUERIA: "TABIQUERÍA",
  "02-T. TABIQUERÍA": "TABIQUERÍA",
  "02-T. TABIQUERIA": "TABIQUERÍA",
  FONTANERÍA: "FONTANERÍA",
  FONTANERIA: "FONTANERÍA",
  "03. FONTANERÍA": "FONTANERÍA",
  "03. FONTANERIA": "FONTANERÍA",
  "04. FONTANERÍA": "FONTANERÍA",
  "04. FONTANERIA": "FONTANERÍA",
  CARPINTERÍA: "CARPINTERÍA",
  CARPINTERIA: "CARPINTERÍA",
  "04. CARPINTERÍA": "CARPINTERÍA",
  "04. CARPINTERIA": "CARPINTERÍA",
  "05. CARPINTERÍA": "CARPINTERÍA",
  "05. CARPINTERIA": "CARPINTERÍA",
  ELECTRICIDAD: "ELECTRICIDAD",
  "05. ELECTRICIDAD": "ELECTRICIDAD",
  "06. ELECTRICIDAD": "ELECTRICIDAD",
  CALEFACCIÓN: "CALEFACCIÓN",
  CALEFACCION: "CALEFACCIÓN",
  "06. CALEFACCIÓN": "CALEFACCIÓN",
  "06. CALEFACCION": "CALEFACCIÓN",
  "07. CALEFACCIÓN": "CALEFACCIÓN",
  "07. CALEFACCION": "CALEFACCIÓN",
  LIMPIEZA: "LIMPIEZA",
  "07. LIMPIEZA": "LIMPIEZA",
  "08. LIMPIEZA": "LIMPIEZA",
  MATERIALES: "MATERIALES",
  "08. MATERIALES": "MATERIALES",
  "10. MATERIALES": "MATERIALES",
  PINTURA: "PINTURA",
  "09. PINTURA": "PINTURA",
  VENTANAS: "VENTANAS",
}

interface CustomPrice {
  id: string
  code: string
  description: string
  unit: string
  final_price: number
  category_id: string
  subcategory: string | null
  is_custom: boolean
  user_id: string
}

interface PriceCategory {
  id: string
  name: string
}

export function AddCustomLineItemDialog({ budgetId, onItemAdded, isOwner = false }: AddCustomLineItemDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saveToCustomPrices, setSaveToCustomPrices] = useState(false)
  const [loadedFromList, setLoadedFromList] = useState(false)
  const [customPrices, setCustomPrices] = useState<CustomPrice[]>([])
  const [priceCategories, setPriceCategories] = useState<PriceCategory[]>([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [generatingWithAI, setGeneratingWithAI] = useState(false)
  const [aiDescription, setAiDescription] = useState("")
  const [searchQuery, setSearchQuery] = useState("") // Declare searchQuery variable
  const [priceSource, setPriceSource] = useState<"normal" | "custom" | "imported">("normal")
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
    category: "",
    concept_code: "",
    concept: "",
    description: "",
    unit: "Ud",
    quantity: 1,
    unit_price: 0,
  })

  useEffect(() => {
    if (!open) {
      // Reset form data when dialog closes
      setFormData({
        category: "",
        concept_code: "",
        concept: "",
        description: "",
        unit: "Ud",
        quantity: 1,
        unit_price: 0,
      })
      setAiDescription("")
      setLoadedFromList(false)
    }
  }, [open])

  useEffect(() => {
    if (open && !isOwner) {
      loadPriceCategories()
    } else if (open && isOwner) {
      loadPriceCategories()
    }
  }, [open, isOwner])

  const loadPriceCategories = async () => {
    try {
      const supabase = await createClient()
      if (!supabase) return

      const { data, error } = await supabase.from("price_categories").select("id, name").order("name")

      if (error) throw error

      console.log("[v0] Categorías cargadas:", data?.length || 0)
      setPriceCategories(data || [])
    } catch (err) {
      console.error("[v0] Error loading categories:", err)
    }
  }

  const loadNormalPrices = async () => {
    // Load from price_master (base prices)
    try {
      const supabase = await createClient()
      if (!supabase) return

      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

      const { data: userProfile } = await supabase
        .from("user_profiles")
        .select("country_code")
        .eq("user_id", userData.user.id)
        .single()

      const country = userProfile?.country_code?.toLowerCase() || "es"
      const priceTable = country === "es" ? "price_master" : `price_master_${country}`

      const { data: baseData } = await supabase.from(priceTable).select("*").eq("is_active", true).limit(500)

      setCustomPrices(baseData || [])
    } catch (error) {
      console.error("Error loading normal prices:", error)
      setCustomPrices([])
    }
  }

  const loadPersonalizedPrices = async () => {
    // Load from user_prices where is_custom = true
    try {
      const supabase = await createClient()
      if (!supabase) return

      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

      const { data: userProfile } = await supabase
        .from("user_profiles")
        .select("country_code")
        .eq("user_id", userData.user.id)
        .single()

      const country = userProfile?.country_code?.toLowerCase() || "es"
      const userTable = country === "es" ? "user_prices" : `user_prices_${country}`

      const { data: customData } = await supabase
        .from(userTable)
        .select("*")
        .eq("user_id", userData.user.id)
        .eq("is_custom", true)
        .limit(500)

      setCustomPrices(customData || [])
    } catch (error) {
      console.error("Error loading personalized prices:", error)
      setCustomPrices([])
    }
  }

  const loadImportedPrices = async () => {
    // Load from user_prices where is_imported = true
    try {
      const supabase = await createClient()
      if (!supabase) return

      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

      const { data: userProfile } = await supabase
        .from("user_profiles")
        .select("country_code")
        .eq("user_id", userData.user.id)
        .single()

      const country = userProfile?.country_code?.toLowerCase() || "es"
      const userTable = country === "es" ? "user_prices" : `user_prices_${country}`

      const { data: importedData } = await supabase
        .from(userTable)
        .select("*")
        .eq("user_id", userData.user.id)
        .eq("is_imported", true)
        .eq("is_active", true)
        .limit(500)

      setCustomPrices(importedData || [])
    } catch (error) {
      console.error("Error loading imported prices:", error)
      setCustomPrices([])
    }
  }

  useEffect(() => {
    if (!open || isOwner) return

    if (priceSource === "normal") {
      loadNormalPrices()
    } else if (priceSource === "custom") {
      loadPersonalizedPrices()
    } else if (priceSource === "imported") {
      loadImportedPrices()
    }
  }, [open, isOwner, priceSource])

  const loadPriceFromList = (price: CustomPrice) => {
    const category = priceCategories.find((cat) => cat.id === price.category_id)
    let categoryName = category
      ? category.name
        .toUpperCase()
        .replace(/^\d+\.\s*/, "")
        .replace(/^\d+-[A-Z]\.\s*/, "")
      : "OTROS"
    categoryName = CATEGORY_MAPPING[categoryName] || categoryName

    setFormData({
      category: categoryName,
      concept_code: price.code,
      concept: price.description,
      description: price.subcategory || "",
      unit: price.unit,
      quantity: 1,
      unit_price: price.final_price,
    })

    setLoadedFromList(true)
    setSearchOpen(false)
    toast({
      title: "Precio cargado",
      description: "Los datos se han cargado desde tu lista de precios",
    })
  }

  const handleGenerateWithAI = async () => {
    if (!aiDescription.trim()) return

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
        body: JSON.stringify({
          prompt: aiDescription,
        }),
      })

      if (!response.ok) throw new Error("Error en la generación")

      const data = await response.json()

      console.log("[v0] AI response data:", data)

      let generatedCategory = data.category || "OTROS"
      generatedCategory = CATEGORY_MAPPING[generatedCategory] || generatedCategory

      setFormData({
        category: generatedCategory,
        concept_code: data.code || "",
        concept: data.concept || data.description || "",
        description: data.description || "",
        unit: data.unit || "Ud",
        quantity: data.quantity || 1,
        unit_price: isOwner ? 0 : data.unit_price || 0,
      })

      console.log("[v0] AI generated item with category:", generatedCategory)

      toast({
        title: "Partida generada",
        description: isOwner
          ? "Se ha generado la partida. Revisa los datos antes de añadirla."
          : "Se ha generado la partida con precio estimado. Revisa los datos antes de añadirla.",
      })
    } catch (err) {
      console.error("[v0] Error generating with AI:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo generar la partida. Intenta de nuevo.",
      })
    } finally {
      setGeneratingWithAI(false)
    }
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    if (!formData.concept) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor introduce al menos el concepto de la partida",
      })
      return
    }

    if (!isOwner && formData.unit_price <= 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor introduce un precio válido",
      })
      return
    }

    try {
      setLoading(true)

      let categoryName = formData.category || "OTROS"
      if (categoryName) {
        categoryName = categoryName
          .toUpperCase()
          .replace(/^\d+\.\s*/, "")
          .replace(/^\d+-[A-Z]\.\s*/, "")
        categoryName = CATEGORY_MAPPING[categoryName] || categoryName
      }

      console.log("[v0] Final category name:", categoryName)
      console.log("[v0] Form data before submit:", formData)

      const lineItem: Omit<BudgetLineItem, "id" | "budget_id" | "created_at" | "updated_at"> & {
        added_by_owner?: boolean
      } = {
        category: categoryName,
        concept_code: formData.concept_code || undefined,
        concept: formData.concept.toUpperCase(),
        description: formData.description,
        unit: formData.unit,
        quantity: formData.quantity,
        unit_price: isOwner ? 0 : formData.unit_price,
        total_price: isOwner ? 0 : formData.quantity * formData.unit_price,
        is_custom: true,
        added_by_owner: isOwner,
        sort_order: 999,
      }

      console.log("[v0] Line item to add:", lineItem)

      const supabase = await createClient()

      if (!supabase) {
        throw new Error("No se pudo conectar con la base de datos")
      }

      await BudgetService.addCustomLineItem(budgetId, lineItem, supabase)

      console.log("[v0] Partida añadida al presupuesto")

      if (!isOwner && saveToCustomPrices && !loadedFromList) {
        try {
          console.log("[v0] Guardando en precios personalizados...")

          const { data: userData, error: userError } = await supabase.auth.getUser()

          if (userError || !userData.user) {
            throw new Error("Usuario no autenticado")
          }

          let categoryId: string | null = null

          const cleanCategoryName = formData.category
            .toUpperCase()
            .replace(/^\d+\.\s*/, "")
            .replace(/^\d+-[A-Z]\.\s*/, "")

          const matchingCategory = priceCategories.find((cat) => {
            const cleanCatName = cat.name
              .toUpperCase()
              .replace(/^\d+\.\s*/, "")
              .replace(/^\d+-[A-Z]\.\s*/, "")
            return cleanCatName === cleanCategoryName
          })

          if (matchingCategory) {
            categoryId = matchingCategory.id
          } else {
            const { data: category } = await supabase
              .from("price_categories")
              .select("id")
              .ilike("name", cleanCategoryName)
              .maybeSingle()

            if (category) {
              categoryId = category.id
            } else {
              const ventanasCategory = priceCategories.find((cat) => cat.name.toLowerCase() === "ventanas")
              if (ventanasCategory) {
                categoryId = ventanasCategory.id
              } else if (priceCategories.length > 0) {
                categoryId = priceCategories[0].id
              }
            }
          }

          if (!categoryId) {
            throw new Error("No se pudo encontrar una categoría válida")
          }

          const totalCost = formData.unit_price
          const laborCost = totalCost * 0.6
          const materialCost = totalCost * 0.4

          const priceData = {
            id: self.crypto.randomUUID(),
            code: formData.concept_code || `CUSTOM-${Date.now()}`,
            category_id: categoryId,
            subcategory: formData.description || null,
            description: formData.concept.toUpperCase(),
            unit: formData.unit,
            material_cost: materialCost,
            labor_cost: laborCost,
            base_price: totalCost * 0.8,
            profit_margin: 20,
            final_price: totalCost,
            is_custom: true,
            is_active: true,
            user_id: userData.user.id,
            created_by: userData.user.id,
          }

          const { error: insertError } = await supabase.from("price_master").insert(priceData)

          if (insertError) {
            throw insertError
          }

          toast({
            title: "Partida añadida",
            description: "La partida se ha añadido al presupuesto y a tus precios personalizados",
          })
        } catch (err) {
          console.error("[v0] Error guardando en precios personalizados:", err)
          toast({
            title: "Partida añadida",
            description: "La partida se añadió al presupuesto pero no se pudo guardar en precios personalizados",
          })
        }
      } else {
        toast({
          title: "Partida añadida",
          description: isOwner
            ? "La partida se ha añadido. Los profesionales podrán cotizarla."
            : "La partida se ha añadido al presupuesto correctamente",
        })
      }

      setOpen(false)
      resetForm()
      onItemAdded()
    } catch (err) {
      console.error("[v0] Error en handleSubmit:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo añadir la partida",
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      category: "",
      concept_code: "",
      concept: "",
      description: "",
      unit: "Ud",
      quantity: 1,
      unit_price: 0,
    })
    setSaveToCustomPrices(false)
    setLoadedFromList(false)
    setAiDescription("")
    setSearchOpen(false)
    setSearchQuery("") // Reset searchQuery on form reset
  }

  const filteredCustomPrices = customPrices.filter((price) => {
    if (!searchQuery.trim()) return true

    const searchTerm = searchQuery.toLowerCase()
    const description = (price.description || "").toLowerCase()
    const subcategory = (price.subcategory || "").toLowerCase()
    const code = (price.code || "").toLowerCase()

    return description.includes(searchTerm) || subcategory.includes(searchTerm) || code.includes(searchTerm)
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Añadir Partida Personalizada
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Añadir Partida Personalizada</DialogTitle>
          <DialogDescription>
            {isOwner
              ? "Añade una partida que necesites incluir en tu proyecto. Los profesionales la cotizarán cuando reciban tu solicitud."
              : "Añade una partida personalizada al presupuesto. Puedes cargarla desde tu lista, crearla con IA o manualmente."}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={isOwner ? "manual" : "manual"} className="w-full">
          <TabsList className={`grid w-full ${isOwner ? "grid-cols-2" : "grid-cols-3"}`}>
            <TabsTrigger value="manual">Manual</TabsTrigger>
            {!isOwner && <TabsTrigger value="from-list">Desde Mi Lista</TabsTrigger>}
            {isMaster && (
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
            )}
          </TabsList>

          {!isOwner && (
            <TabsContent value="from-list" className="space-y-4">
              <div className="space-y-2">
                <Label>Selecciona la fuente de precios</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={priceSource === "normal" ? "default" : "outline"}
                    onClick={() => setPriceSource("normal")}
                    className="text-sm"
                  >
                    Precios Normales
                  </Button>
                  <Button
                    variant={priceSource === "custom" ? "default" : "outline"}
                    onClick={() => setPriceSource("custom")}
                    className="text-sm"
                  >
                    Mis Personalizados
                  </Button>
                  <Button
                    variant={priceSource === "imported" ? "default" : "outline"}
                    onClick={() => setPriceSource("imported")}
                    className="text-sm"
                  >
                    Mis Importados
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Buscar en mi lista de precios</Label>
                {customPrices.length === 0 ? (
                  <div className="rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950/20 p-4">
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                      No se encontraron precios disponibles
                    </p>
                    <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                      {priceSource === "custom" &&
                        "Crea una partida manualmente o con IA y marca 'Guardar en mi tabla de precios personalizados'"}
                      {priceSource === "imported" && "Importa precios desde un PDF en la sección de Gestión de Precios"}
                      {priceSource === "normal" && "Usa los precios normales disponibles"}
                    </p>
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
                        <CommandInput
                          placeholder="Buscar precio..."
                          className="focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                          value={searchQuery}
                          onValueChange={setSearchQuery}
                        />
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
                                      {formatNumber(price.final_price)} €/{price.unit}
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

              {/* Form fields for from-list - same as manual but pre-filled */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category-list">
                    Categoría <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger id="category-list">
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code-list">Código</Label>
                  <Input
                    id="code-list"
                    value={formData.concept_code}
                    onChange={(e) => setFormData({ ...formData, concept_code: e.target.value })}
                    placeholder="Ej: 01-D-01"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="concept-list">
                  Concepto <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="concept-list"
                  value={formData.concept}
                  onChange={(e) => setFormData({ ...formData, concept: e.target.value })}
                  placeholder="Nombre de la partida"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description-list">Descripción</Label>
                <Textarea
                  id="description-list"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción detallada de la partida"
                  rows={2}
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
                      <SelectItem value="Ud">Ud</SelectItem>
                      <SelectItem value="m²">m²</SelectItem>
                      <SelectItem value="ml">ml</SelectItem>
                      <SelectItem value="m³">m³</SelectItem>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="h">h</SelectItem>
                      <SelectItem value="PA">PA</SelectItem>
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
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price-list">
                    Precio/Ud <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="price-list"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({ ...formData, unit_price: Number.parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Añadiendo...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Añadir Partida
                    </>
                  )}
                </Button>
              </DialogFooter>
            </TabsContent>
          )}

          <TabsContent value="ai" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ai-description">Describe la partida que necesitas</Label>
              <Textarea
                id="ai-description"
                value={aiDescription}
                onChange={(e) => setAiDescription(e.target.value)}
                placeholder={
                  isOwner
                    ? "Ej: Necesito instalar una ventana de aluminio con doble cristal de 120x100cm..."
                    : "Ej: Instalación de ventana de aluminio con rotura de puente térmico, doble cristal, de 120x100cm..."
                }
                rows={3}
              />
              <Button onClick={handleGenerateWithAI} disabled={generatingWithAI} className="w-full">
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

            {formData.concept && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Categoría</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Código</Label>
                    <Input
                      value={formData.concept_code}
                      onChange={(e) => setFormData({ ...formData, concept_code: e.target.value })}
                      placeholder="Ej: 01-D-01"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Concepto</Label>
                  <Input
                    value={formData.concept}
                    onChange={(e) => setFormData({ ...formData, concept: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Unidad</Label>
                    <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ud">Ud</SelectItem>
                        <SelectItem value="m²">m²</SelectItem>
                        <SelectItem value="ml">ml</SelectItem>
                        <SelectItem value="m³">m³</SelectItem>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="h">h</SelectItem>
                        <SelectItem value="PA">PA</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Cantidad</Label>
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: Number.parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  {!isOwner && (
                    <div className="space-y-2">
                      <Label>Precio/Ud</Label>
                      <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={formData.unit_price}
                        onChange={(e) =>
                          setFormData({ ...formData, unit_price: Number.parseFloat(e.target.value) || 0 })
                        }
                      />
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSubmit} disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Añadiendo...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Añadir Partida
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </>
            )}
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">
                    Categoría <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">Código</Label>
                  <Input
                    id="code"
                    value={formData.concept_code}
                    onChange={(e) => setFormData({ ...formData, concept_code: e.target.value })}
                    placeholder="Ej: 01-D-01"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="concept">
                  Concepto <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="concept"
                  value={formData.concept}
                  onChange={(e) => setFormData({ ...formData, concept: e.target.value })}
                  placeholder="Nombre de la partida"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción detallada de la partida"
                  rows={2}
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
                      <SelectItem value="Ud">Ud</SelectItem>
                      <SelectItem value="m²">m²</SelectItem>
                      <SelectItem value="ml">ml</SelectItem>
                      <SelectItem value="m³">m³</SelectItem>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="h">h</SelectItem>
                      <SelectItem value="PA">PA</SelectItem>
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
                  />
                </div>

                {!isOwner && (
                  <div className="space-y-2">
                    <Label htmlFor="price">
                      Precio/Ud <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={formData.unit_price}
                      onChange={(e) => setFormData({ ...formData, unit_price: Number.parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                )}
              </div>

              {!isOwner && !loadedFromList && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="save-custom"
                    checked={saveToCustomPrices}
                    onCheckedChange={(checked) => setSaveToCustomPrices(checked as boolean)}
                  />
                  <Label htmlFor="save-custom" className="text-sm font-normal">
                    Guardar en mi tabla de precios personalizados
                  </Label>
                </div>
              )}

              {isOwner && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-4">
                  <p className="text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Esta partida se destacará en tu presupuesto para que los profesionales la coticen.
                  </p>
                </div>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Añadiendo...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Añadir Partida
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
      <AIPriceImportDialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog} mode="generate" />
    </Dialog>
  )
}
