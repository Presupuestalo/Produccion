"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { EditableLineItem } from "./editable-line-item"
import { AddCustomLineItemDialog } from "./add-custom-line-item-dialog"
import type { BudgetCategory } from "@/lib/types/budget"
import { BudgetService } from "@/lib/services/budget-service"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils/format"
import { Lock, ChevronDown, ChevronUp, Trash2, Sparkles } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import type { SupabaseClient } from "@supabase/supabase-js"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface BudgetLineItemsEditorProps {
  budgetId: string
  categories: BudgetCategory[]
  isLocked: boolean
  isOwner?: boolean
  onItemsUpdated: () => void
}

export function BudgetLineItemsEditor({
  budgetId,
  categories,
  isLocked,
  isOwner = false,
  onItemsUpdated,
}: BudgetLineItemsEditorProps) {
  const { toast } = useToast()
  const [supabaseClient, setSupabaseClient] = useState<SupabaseClient | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    const initClient = async () => {
      const client = await createClient()
      setSupabaseClient(client)
    }
    initClient()
  }, [])

  const handleUpdateItem = async (itemId: string, updates: any) => {
    console.log("[v0] Attempting to update line item:", itemId, updates)

    if (!supabaseClient) {
      console.error("[v0] Supabase client not initialized yet")
      toast({
        variant: "destructive",
        title: "Error",
        description: "El cliente de base de datos no está listo. Inténtalo de nuevo.",
      })
      return
    }

    try {
      await BudgetService.updateLineItem(itemId, updates, supabaseClient)
      console.log("[v0] Line item updated successfully")
      toast({
        title: "Partida actualizada",
        description: "Los cambios se han guardado correctamente",
      })
      onItemsUpdated()
    } catch (err) {
      console.error("[v0] Error updating line item:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar la partida",
      })
      throw err
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    console.log("[v0] Attempting to delete line item:", itemId)

    if (!supabaseClient) {
      console.error("[v0] Supabase client not initialized yet")
      toast({
        variant: "destructive",
        title: "Error",
        description: "El cliente de base de datos no está listo. Inténtalo de nuevo.",
      })
      return
    }

    try {
      await BudgetService.deleteLineItem(itemId, supabaseClient)
      console.log("[v0] Line item deleted successfully")
      toast({
        title: "Partida eliminada",
        description: "La partida se ha eliminado del presupuesto",
      })
      onItemsUpdated()
    } catch (err) {
      console.error("[v0] Error deleting line item:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar la partida",
      })
      throw err
    }
  }

  const totalOriginal = categories.reduce((sum, cat) => sum + cat.subtotal, 0)

  const isOwnerCustomItem = (item: any) => {
    return item.concept_code?.startsWith("PROP-") || (item.is_custom && item.price_type === "owner_custom")
  }

  const ownerItems: any[] = []
  const regularCategories: BudgetCategory[] = []

  categories.forEach((category) => {
    const ownerCategoryItems = category.items.filter(isOwnerCustomItem)
    const regularCategoryItems = category.items.filter((item) => !isOwnerCustomItem(item))

    ownerItems.push(...ownerCategoryItems)

    if (regularCategoryItems.length > 0) {
      regularCategories.push({
        ...category,
        items: regularCategoryItems,
        subtotal: regularCategoryItems.reduce((sum, item) => sum + item.total_price, 0),
      })
    }
  })

  const OwnerLineItem = ({ item, onDelete }: { item: any; onDelete: (id: string) => void }) => {
    const isCustomByOwner = isOwnerCustomItem(item)

    return (
      <tr
        className={
          isCustomByOwner
            ? "bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-l-4 border-l-amber-500"
            : ""
        }
      >
        <td className="px-4 py-3 align-top">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h4 className="font-medium text-sm">{item.concept}</h4>
            {item.concept_code && (
              <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">{item.concept_code}</span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{item.description}</p>
          {(item.color || item.brand || item.model) && (
            <p className="text-xs text-muted-foreground mt-1">
              {[
                item.color && `Color: ${item.color}`,
                item.brand && `Marca: ${item.brand}`,
                item.model && `Modelo: ${item.model}`,
              ]
                .filter(Boolean)
                .join(" • ")}
            </p>
          )}
        </td>
        <td className="px-4 py-3 text-center align-top whitespace-nowrap">
          <span className="font-medium">
            {item.quantity} {item.unit}
          </span>
        </td>
        <td className="px-4 py-3 text-center align-top">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar partida?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción eliminará la partida "{item.concept}" del presupuesto. Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(item.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </td>
      </tr>
    )
  }

  if (isLocked) {
    return (
      <Card className="border-2 border-orange-200 bg-orange-50/50 dark:bg-orange-950/10">
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-orange-600" />
                <CardTitle className="text-base font-medium">Presupuesto Original (Bloqueado)</CardTitle>
              </div>
              <div className="flex items-center gap-4">
                {!isOwner && <span className="text-lg font-bold text-primary">{formatCurrency(totalOriginal)}</span>}
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm">
                    {isExpanded ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-1" />
                        Contraer
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-1" />
                        Ver Detalle
                      </>
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-4">
              <Alert className="border-orange-200 bg-orange-100 dark:bg-orange-950/30">
                <AlertDescription className="text-orange-800 dark:text-orange-200 text-sm">
                  Este presupuesto ha sido aceptado y no se puede modificar. Usa la sección de "Ajustes y Partidas
                  Adicionales" para añadir o restar partidas.
                </AlertDescription>
              </Alert>

              {categories.map((category) => (
                <Card key={category.category} className="bg-background">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">{category.category}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {category.items.map((item) => (
                        <div key={item.id} className="p-4 text-sm">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-medium">{item.concept}</div>
                              {item.description && (
                                <div className="text-muted-foreground text-xs mt-1">{item.description}</div>
                              )}
                              {(item.color || item.brand || item.model) && (
                                <div className="text-muted-foreground text-xs mt-1">
                                  {[
                                    item.color && `Color: ${item.color}`,
                                    item.brand && `Marca: ${item.brand}`,
                                    item.model && `Modelo: ${item.model}`,
                                  ]
                                    .filter(Boolean)
                                    .join(" • ")}
                                </div>
                              )}
                              {isOwner ? (
                                <div className="text-muted-foreground text-xs mt-1">
                                  Cantidad: {item.quantity} {item.unit}
                                </div>
                              ) : (
                                <div className="text-muted-foreground text-xs mt-1">
                                  {item.quantity} {item.unit} × {formatCurrency(item.unit_price)}
                                </div>
                              )}
                            </div>
                            {!isOwner && (
                              <div className="text-right font-semibold">{formatCurrency(item.total_price)}</div>
                            )}
                          </div>
                        </div>
                      ))}
                      {!isOwner && (
                        <div className="p-4 bg-muted/50">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-sm">Total {category.category}</span>
                            <span className="font-bold text-base text-primary">
                              {formatCurrency(category.subtotal)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Partidas del Presupuesto</h3>
        <AddCustomLineItemDialog budgetId={budgetId} onItemAdded={onItemsUpdated} isOwner={isOwner} />
      </div>

      {isOwner && (
        <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <Sparkles className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 dark:text-amber-100 text-sm">
            Puedes añadir partidas personalizadas que serán revisadas por los profesionales. Las partidas que añadas se
            mostrarán destacadas para que puedan cotizarlas.
          </AlertDescription>
        </Alert>
      )}

      {regularCategories.map((category) => (
        <Card key={category.category}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">{category.category}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isOwner ? (
              // Owner view: Table without prices
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-orange-500 text-white">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold w-[55%]">Concepto</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold w-[12%]">Cant.</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold w-[23%]"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {category.items.map((item) => (
                      <OwnerLineItem key={item.id} item={item} onDelete={handleDeleteItem} />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              // Professional view: Table with prices and editable functionality
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-orange-500 text-white">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold w-[55%]">Concepto</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold w-[12%]">Cant.</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold w-[13%]">P. Unit.</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold w-[13%]">Total</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold w-[7%]"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {category.items.map((item) => (
                      <EditableLineItem
                        key={item.id}
                        item={item}
                        isEditable={!isLocked}
                        onUpdate={handleUpdateItem}
                        onDelete={handleDeleteItem}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="p-4 bg-muted/50">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-sm">Total {category.category}</span>
                <span className="font-bold text-base text-primary">{formatCurrency(category.subtotal)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {ownerItems.length > 0 && (
        <Card className="border-2 border-amber-400 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
          <CardHeader className="pb-3 bg-amber-100/50 dark:bg-amber-900/20">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-base font-semibold text-amber-800 dark:text-amber-100">
                Partidas Sin Definir
              </CardTitle>
              <span className="text-sm text-amber-600 dark:text-amber-400">
                ({ownerItems.length} {ownerItems.length === 1 ? "partida" : "partidas"})
              </span>
            </div>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              {isOwner
                ? "Estas partidas serán revisadas y cotizadas por los profesionales que reciban tu solicitud."
                : "El propietario ha solicitado incluir estas partidas adicionales. Revísalas y añade tu precio."}
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-amber-200 dark:bg-amber-900/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-amber-900 dark:text-amber-100 w-[55%]">
                      Concepto
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-amber-900 dark:text-amber-100 w-[12%]">
                      Cant.
                    </th>
                    {!isOwner && (
                      <>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-amber-900 dark:text-amber-100 w-[13%]">
                          P. Unit.
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-amber-900 dark:text-amber-100 w-[13%]">
                          Total
                        </th>
                      </>
                    )}
                    <th className="px-4 py-3 text-center text-sm font-semibold text-amber-900 dark:text-amber-100 w-[7%]">
                      {!isOwner && "Sin cotizar"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-200 dark:divide-amber-800">
                  {ownerItems.map((item) => {
                    const isCustomByOwner = isOwnerCustomItem(item)
                    return (
                      <tr
                        key={item.id}
                        className={
                          isCustomByOwner
                            ? "bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-l-4 border-l-amber-500"
                            : ""
                        }
                      >
                        <td className="px-4 py-3 align-top">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h4 className="font-medium text-sm">{item.concept}</h4>
                            {item.concept_code && (
                              <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                                {item.concept_code}
                              </span>
                            )}
                            {isCustomByOwner && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
                                <Sparkles className="h-3 w-3" />
                                {isOwner ? "Añadida por ti" : "Del propietario"}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                          {(item.color || item.brand || item.model) && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {[
                                item.color && `Color: ${item.color}`,
                                item.brand && `Marca: ${item.brand}`,
                                item.model && `Modelo: ${item.model}`,
                              ]
                                .filter(Boolean)
                                .join(" • ")}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center align-top whitespace-nowrap">
                          <span className="font-medium">
                            {item.quantity} {item.unit}
                          </span>
                        </td>
                        {!isOwner && (
                          <>
                            <td className="px-4 py-3 text-right align-top">
                              <span className="font-medium">{formatCurrency(item.unit_price)}</span>
                            </td>
                            <td className="px-4 py-3 text-right align-top">
                              <span className="font-semibold text-primary">{formatCurrency(item.total_price)}</span>
                            </td>
                          </>
                        )}
                        <td className="px-4 py-3 text-center align-top">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar partida?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción eliminará la partida "{item.concept}" del presupuesto. Esta acción no se
                                  puede deshacer.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteItem(item.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {categories.length === 0 && ownerItems.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No hay partidas en este presupuesto</p>
            <p className="text-sm text-muted-foreground mt-2">Añade partidas personalizadas usando el botón superior</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
