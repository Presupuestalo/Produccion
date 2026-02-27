"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Trash2, ChevronDown, ChevronUp, Infinity } from "lucide-react"
import type { PriceTier } from "@/lib/services/price-service"

interface PriceTiersEditorProps {
    tiers: PriceTier[]
    unit: string
    currencySymbol: string
    onChange: (tiers: PriceTier[]) => void
}

// Internal draft row uses strings so fields can be emptied while typing
interface TierDraft {
    min_quantity: string
    max_quantity: string // empty string = ∞
    price_override: string
    label: string | null
    // Original tier fields for saving
    _original: PriceTier
}

function tierToStr(t: PriceTier): TierDraft {
    return {
        min_quantity: t.min_quantity === 0 ? "" : t.min_quantity.toString().replace(".", ","),
        max_quantity: t.max_quantity === null ? "" : t.max_quantity.toString().replace(".", ","),
        price_override: t.price_override === 0 ? "" : t.price_override.toString().replace(".", ","),
        label: t.label ?? null,
        _original: t,
    }
}

function parseNum(s: string): number {
    return parseFloat(s.replace(",", ".")) || 0
}

export function PriceTiersEditor({ tiers, unit, currencySymbol, onChange }: PriceTiersEditorProps) {
    const [expanded, setExpanded] = useState(tiers.length > 0)
    // Local draft state for display; synced to parent on blur
    const [drafts, setDrafts] = useState<TierDraft[]>(() => tiers.map(tierToStr))

    // Re-sync drafts when tiers prop changes from outside (e.g. after async DB load)
    useEffect(() => {
        setDrafts(tiers.map(tierToStr))
        if (tiers.length > 0) setExpanded(true)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tiers.length])

    function syncToParent(newDrafts: TierDraft[]) {
        const parsed: PriceTier[] = newDrafts.map((d) => ({
            ...d._original,
            min_quantity: parseNum(d.min_quantity),
            max_quantity: d.max_quantity === "" ? null : parseNum(d.max_quantity),
            price_override: parseNum(d.price_override),
            label: d.label,
        }))
        onChange(parsed)
    }

    function updateDraft(index: number, field: keyof TierDraft, value: string | null) {
        const newDrafts = drafts.map((d, i) => (i === index ? { ...d, [field]: value } : d))
        setDrafts(newDrafts)
    }

    function commitDraft(index: number, field: keyof TierDraft, rawValue: string) {
        // Format number on blur: "3" → "3,00"
        const num = parseNum(rawValue)
        const formatted = field === "max_quantity" && rawValue === "" ? "" : num.toFixed(2).replace(".", ",")
        const newDrafts = drafts.map((d, i) => (i === index ? { ...d, [field]: formatted } : d))
        setDrafts(newDrafts)
        syncToParent(newDrafts)
    }

    function addTier() {
        const lastTier = tiers[tiers.length - 1]
        const newMin = lastTier ? (lastTier.max_quantity ?? 0) : 0
        const newTier: PriceTier = { min_quantity: newMin, max_quantity: null, price_override: 0, label: null }
        const newDraft = tierToStr(newTier)
        const newDrafts = [...drafts, newDraft]
        setDrafts(newDrafts)
        onChange([...tiers, newTier])
        setExpanded(true)
    }

    function removeTier(index: number) {
        const newDrafts = drafts.filter((_, i) => i !== index)
        setDrafts(newDrafts)
        syncToParent(newDrafts)
        if (newDrafts.length === 0) setExpanded(false)
    }

    return (
        <div className="border rounded-lg overflow-hidden">
            {/* Header toggle */}
            <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-muted/50 hover:bg-muted transition-colors text-sm font-medium"
            >
                <span className="flex items-center gap-2">
                    <span>Franjas de precio</span>
                    {tiers.length > 0 && (
                        <span className="bg-primary/10 text-primary text-xs font-bold px-1.5 py-0.5 rounded-full">
                            {tiers.length}
                        </span>
                    )}
                </span>
                {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>

            {expanded && (
                <div className="p-3 space-y-3">
                    {drafts.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-2">
                            Sin franjas. El precio será fijo para cualquier cantidad.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {/* Column headers */}
                            <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 text-xs font-medium text-muted-foreground px-1">
                                <span>Desde ({unit})</span>
                                <span>Hasta ({unit})</span>
                                <span>Precio ({currencySymbol}/{unit})</span>
                                <span></span>
                            </div>
                            {drafts.map((draft, i) => (
                                <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
                                    {/* Desde */}
                                    <Input
                                        type="text"
                                        inputMode="decimal"
                                        value={draft.min_quantity}
                                        placeholder="0,00"
                                        onChange={(e) => updateDraft(i, "min_quantity", e.target.value)}
                                        onFocus={(e) => e.target.select()}
                                        onBlur={(e) => commitDraft(i, "min_quantity", e.target.value)}
                                        className="h-8 text-sm"
                                    />
                                    {/* Hasta */}
                                    <div className="relative">
                                        <Input
                                            type="text"
                                            inputMode="decimal"
                                            value={draft.max_quantity}
                                            placeholder="∞"
                                            onChange={(e) => updateDraft(i, "max_quantity", e.target.value)}
                                            onFocus={(e) => e.target.select()}
                                            onBlur={(e) => commitDraft(i, "max_quantity", e.target.value)}
                                            className="h-8 text-sm pr-7"
                                        />
                                        {draft.max_quantity === "" && (
                                            <Infinity className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                                        )}
                                    </div>
                                    {/* Precio */}
                                    <Input
                                        type="text"
                                        inputMode="decimal"
                                        value={draft.price_override}
                                        placeholder="0,00"
                                        onChange={(e) => updateDraft(i, "price_override", e.target.value)}
                                        onFocus={(e) => e.target.select()}
                                        onBlur={(e) => commitDraft(i, "price_override", e.target.value)}
                                        className="h-8 text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeTier(i)}
                                        title="Eliminar franja"
                                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addTier}
                        className="w-full gap-1.5 h-8 text-xs border-dashed"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Añadir franja
                    </Button>

                    {/* Validation warning for overlaps */}
                    {tiers.length > 1 && (() => {
                        for (let i = 0; i < tiers.length - 1; i++) {
                            const curr = tiers[i]
                            const next = tiers[i + 1]
                            if (curr.max_quantity !== null && next.min_quantity !== curr.max_quantity) {
                                return (
                                    <p className="text-xs text-amber-600 bg-amber-50 rounded px-2 py-1">
                                        ⚠ Hay un hueco o solapamiento entre franjas. Asegúrate de que el "Hasta" de una franja coincida con el "Desde" de la siguiente.
                                    </p>
                                )
                            }
                        }
                        return null
                    })()}
                </div>
            )}
        </div>
    )
}
