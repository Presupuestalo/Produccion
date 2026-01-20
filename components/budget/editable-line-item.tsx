"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Check, X, Pencil, Trash2 } from "lucide-react"
import type { BudgetLineItem } from "@/lib/types/budget"
import { formatCurrency } from "@/lib/utils/format"
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

interface EditableLineItemProps {
  item: BudgetLineItem
  isEditable: boolean
  onUpdate: (itemId: string, updates: Partial<BudgetLineItem>) => Promise<void>
  onDelete: (itemId: string) => Promise<void>
}

export function EditableLineItem({ item, isEditable, onUpdate, onDelete }: EditableLineItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedItem, setEditedItem] = useState({
    quantity: item.quantity,
    unit_price: item.unit_price,
    description: item.description || "",
    color: item.color || "",
    brand: item.brand || "",
    model: item.model || "",
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setEditedItem({
      quantity: item.quantity,
      unit_price: item.unit_price,
      description: item.description || "",
      color: item.color || "",
      brand: item.brand || "",
      model: item.model || "",
    })
  }, [item.quantity, item.unit_price, item.description, item.color, item.brand, item.model])

  const handleSave = async () => {
    try {
      setIsSaving(true)
      await onUpdate(item.id, editedItem)
      setIsEditing(false)
    } catch (err) {
      console.error("[EditableLineItem] Error saving:", err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditedItem({
      quantity: item.quantity,
      unit_price: item.unit_price,
      description: item.description || "",
      color: item.color || "",
      brand: item.brand || "",
      model: item.model || "",
    })
    setIsEditing(false)
  }

  const handleDelete = async () => {
    try {
      await onDelete(item.id)
    } catch (err) {
      console.error("[EditableLineItem] Error deleting:", err)
    }
  }

  const calculatedTotal = editedItem.quantity * editedItem.unit_price

  if (isEditing) {
    return (
      <tr className="bg-muted/50 border-l-4 border-primary">
        <td colSpan={5} className="p-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-sm">{item.concept}</h4>
              {item.concept_code && (
                <span className="text-xs text-muted-foreground font-mono">{item.concept_code}</span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Descripción</label>
                <Textarea
                  value={editedItem.description}
                  onChange={(e) => setEditedItem({ ...editedItem, description: e.target.value })}
                  className="min-h-[60px]"
                  placeholder="Descripción de la partida"
                />
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Color (opcional)</label>
                  <Input
                    value={editedItem.color}
                    onChange={(e) => setEditedItem({ ...editedItem, color: e.target.value })}
                    placeholder="Ej: Blanco, Roble..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Marca (opcional)</label>
                    <Input
                      value={editedItem.brand}
                      onChange={(e) => setEditedItem({ ...editedItem, brand: e.target.value })}
                      placeholder="Ej: Roca..."
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Modelo (opcional)</label>
                    <Input
                      value={editedItem.model}
                      onChange={(e) => setEditedItem({ ...editedItem, model: e.target.value })}
                      placeholder="Ej: Victoria..."
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Cantidad ({item.unit})</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editedItem.quantity}
                  onChange={(e) => setEditedItem({ ...editedItem, quantity: Number.parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Precio Unitario (€)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editedItem.unit_price}
                  onChange={(e) => setEditedItem({ ...editedItem, unit_price: Number.parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Total</label>
                <div className="h-10 flex items-center px-3 bg-muted rounded-md font-semibold text-primary">
                  {formatCurrency(calculatedTotal)}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={handleCancel} disabled={isSaving}>
                <X className="h-4 w-4 mr-1" />
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                <Check className="h-4 w-4 mr-1" />
                {isSaving ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr className="hover:bg-muted/30 transition-colors group">
      <td className="px-4 py-3 align-top">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <h4 className="font-semibold text-base">{item.concept}</h4>
          {item.concept_code && (
            <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">{item.concept_code}</span>
          )}
          {item.is_custom && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded whitespace-nowrap">
              Personalizada
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
      <td className="px-4 py-3 text-right align-top">
        <span className="font-medium">{formatCurrency(item.unit_price)}</span>
      </td>
      <td className="px-4 py-3 text-right align-top">
        <span className="font-semibold text-primary">{formatCurrency(item.total_price)}</span>
      </td>
      {isEditable && (
        <td className="px-4 py-3 text-center align-top">
          <div className="flex gap-1 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsEditing(true)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar partida?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. La partida "{item.concept}" será eliminada del presupuesto.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </td>
      )}
    </tr>
  )
}
