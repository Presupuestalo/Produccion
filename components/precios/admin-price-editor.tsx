"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"
import { Loader2, Globe } from "lucide-react"
import { COUNTRIES, getCurrencySymbol } from "@/lib/services/currency-service"

interface AdminPriceEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  price: any
}

export function AdminPriceEditor({ open, onOpenChange, price }: AdminPriceEditorProps) {
  const [selectedCountry, setSelectedCountry] = useState("ES")
  const [priceValue, setPriceValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [existingPrices, setExistingPrices] = useState<Record<string, number>>({})
  const { toast } = useToast()

  useEffect(() => {
    if (open && price) {
      loadExistingPrices()
    }
  }, [open, price])

  useEffect(() => {
    if (selectedCountry && existingPrices[selectedCountry]) {
      setPriceValue(existingPrices[selectedCountry].toString())
    } else {
      setPriceValue("")
    }
  }, [selectedCountry, existingPrices])

  const loadExistingPrices = async () => {
    try {
      const { data, error } = await supabase
        .from("price_master_by_country")
        .select("country_code, final_price")
        .eq("price_master_id", price.code)

      if (error) throw error

      const pricesMap: Record<string, number> = {}
      data?.forEach((item) => {
        pricesMap[item.country_code] = item.final_price
      })
      setExistingPrices(pricesMap)
    } catch (error) {
      console.error("Error loading prices:", error)
      toast({
        title: "Error",
        description: "Error al cargar los precios: " + (error as any).message,
        variant: "destructive",
      })
    }
  }

  const handleSave = async () => {
    if (!priceValue || isNaN(Number.parseFloat(priceValue))) {
      toast({
        title: "Error",
        description: "Por favor ingresa un precio válido",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.from("price_master_by_country").upsert({
        price_master_id: price.code,
        country_code: selectedCountry,
        currency_code: COUNTRIES[selectedCountry]?.currency || "EUR",
        final_price: Number.parseFloat(priceValue),
        updated_at: new Date().toISOString(),
      })

      if (error) throw error

      toast({
        title: "Precio actualizado",
        description: `Precio para ${COUNTRIES[selectedCountry]?.name} actualizado correctamente`,
      })

      await loadExistingPrices()
    } catch (error: any) {
      console.error("Error saving price:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el precio",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const currencySymbol = getCurrencySymbol(COUNTRIES[selectedCountry])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Editar Precios por País
          </DialogTitle>
          <DialogDescription>
            {price?.subcategory} - {price?.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="country">País</Label>
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger id="country">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(COUNTRIES).map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    <div className="flex items-center justify-between w-full">
                      <span>{country.name}</span>
                      <span className="text-muted-foreground ml-2">
                        {existingPrices[country.code]
                          ? `${getCurrencySymbol(country)}${existingPrices[country.code].toFixed(2)}`
                          : "Sin precio"}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Precio ({currencySymbol})</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currencySymbol}</span>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={priceValue}
                  onChange={(e) => setPriceValue(e.target.value)}
                  className="pl-8"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-muted p-3 text-sm">
            <p className="font-medium mb-2">Precios actuales:</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(COUNTRIES).map((country) => (
                <div key={country.code} className="flex justify-between">
                  <span className="text-muted-foreground">{country.name}:</span>
                  <span className="font-medium">
                    {existingPrices[country.code]
                      ? `${getCurrencySymbol(country)}${existingPrices[country.code].toFixed(2)}`
                      : "-"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
