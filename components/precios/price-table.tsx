"use client"

import type { PriceMaster, PriceWithCategory } from "@/lib/services/price-service"
import { Edit2, Trash2, Percent, Info } from "lucide-react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface PriceTableProps {
  prices: (PriceMaster | PriceWithCategory)[]
  currencySymbol: string
  onEdit: (price: PriceMaster) => void
  onDelete: (price: PriceMaster) => void
  onIncrease: (price: PriceMaster) => void
  isMaster: boolean
  onAdminEdit: (price: PriceMaster) => void
  hideCode?: boolean
}

const formatPrice = (price: number) => {
  return price.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function PriceTable({
  prices,
  currencySymbol,
  onEdit,
  onDelete,
  onIncrease,
  isMaster,
  onAdminEdit,
  hideCode = false,
}: PriceTableProps) {
  const [selectedPrice, setSelectedPrice] = useState<PriceMaster | null>(null)

  if (prices.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No se encontraron precios en esta categoría.</div>
  }

  return (
    <>
      {/* Desktop view */}
      <div className="hidden md:block rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">Concepto</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Descripción</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Características</th>
              <th className="px-4 py-3 text-left text-sm font-medium">UD</th>
              <th className="px-4 py-3 text-right text-sm font-medium">Precio ({currencySymbol})</th>
              <th className="px-4 py-3 text-right text-sm font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {prices.map((price) => (
              <tr key={price.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 text-sm">
                  <div className="flex items-center gap-2">
                    {price.is_custom && !price.is_imported && (
                      <div className="w-2 h-2 rounded-full bg-emerald-600 flex-shrink-0" title="Personalizado" />
                    )}
                    {price.is_imported && (
                      <div className="w-2 h-2 rounded-full bg-amber-600 flex-shrink-0" title="Importado" />
                    )}
                    <span className="font-medium uppercase">{price.subcategory || price.description}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground max-w-md">
                  {price.long_description || price.description || "-"}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{price.notes || "-"}</td>
                <td className="px-4 py-3 text-sm">{price.unit}</td>
                <td className="px-4 py-3 text-sm text-right font-medium text-green-600 whitespace-nowrap">
                  {formatPrice(price.final_price)} {currencySymbol}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {isMaster ? (
                      <button
                        onClick={() => onAdminEdit(price)}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                        title="Editar como administrador"
                      >
                        <Edit2 className="h-4 w-4 text-muted-foreground" />
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => onEdit(price)}
                          className="p-2 hover:bg-muted rounded-lg transition-colors"
                          title="Editar precio"
                        >
                          <Edit2 className="h-4 w-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => onIncrease(price)}
                          className="p-2 hover:bg-muted rounded-lg transition-colors"
                          title="Ajustar precio"
                        >
                          <Percent className="h-4 w-4 text-muted-foreground" />
                        </button>
                        {(price.is_custom || price.user_id) && (
                          <button
                            onClick={() => onDelete(price)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar precio"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-2">
        {prices.map((price) => (
          <div key={price.id} className="border rounded-lg p-2.5 bg-card">
            <div className="flex items-start justify-between gap-2">
              {/* Left: Concept name with indicator */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  {price.is_custom && !price.is_imported && (
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 flex-shrink-0" />
                  )}
                  {price.is_imported && <div className="w-1.5 h-1.5 rounded-full bg-amber-600 flex-shrink-0" />}
                  <h3 className="font-semibold text-[11px] uppercase leading-tight line-clamp-2">
                    {price.subcategory || price.description}
                  </h3>
                  <button
                    onClick={() => setSelectedPrice(price)}
                    className="p-0.5 hover:bg-muted rounded transition-colors flex-shrink-0"
                    title="Ver detalles"
                  >
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </button>
                </div>

                <div className="text-sm font-bold text-green-600 whitespace-nowrap">
                  {formatPrice(price.final_price)} {currencySymbol}
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex flex-col gap-1">
                {isMaster ? (
                  <button
                    onClick={() => onAdminEdit(price)}
                    className="p-1 hover:bg-muted rounded transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="h-3.5 w-3.5 text-primary" />
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => onEdit(price)}
                      className="p-1 hover:bg-muted rounded transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="h-3.5 w-3.5 text-primary" />
                    </button>
                    {(price.is_custom || price.user_id) && (
                      <button
                        onClick={() => onDelete(price)}
                        className="p-1 hover:bg-red-50 rounded transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-600" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!selectedPrice} onOpenChange={(open) => !open && setSelectedPrice(null)}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg mx-4">
          <DialogHeader>
            <DialogTitle className="uppercase text-sm">
              {selectedPrice?.subcategory || selectedPrice?.description}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-1">Descripción</h4>
              <p className="text-xs">{selectedPrice?.long_description || selectedPrice?.description || "-"}</p>
            </div>
            {selectedPrice?.notes && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-1">Características</h4>
                <p className="text-xs">{selectedPrice.notes}</p>
              </div>
            )}
            <div className="flex items-center justify-between pt-2 border-t">
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-1">Unidad</h4>
                <p className="text-sm font-medium">{selectedPrice?.unit}</p>
              </div>
              <div className="text-right">
                <h4 className="text-xs font-medium text-muted-foreground mb-1">Precio</h4>
                <p className="text-base font-bold text-green-600 whitespace-nowrap">
                  {selectedPrice && formatPrice(selectedPrice.final_price)} {currencySymbol}
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
