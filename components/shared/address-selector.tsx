"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { hispanicCountries, spanishProvinces, citiesByProvince } from "@/lib/data/spain-locations"

interface AddressSelectorProps {
  // Valores actuales
  country?: string
  province?: string
  city?: string
  street?: string
  postalCode?: string

  // Callbacks para actualizar valores
  onCountryChange?: (value: string) => void
  onProvinceChange?: (value: string) => void
  onCityChange?: (value: string) => void
  onStreetChange?: (value: string) => void
  onPostalCodeChange?: (value: string) => void

  // Configuración
  required?: boolean
  disabled?: boolean
  showStreet?: boolean
  showPostalCode?: boolean

  // Labels personalizados
  countryLabel?: string
  provinceLabel?: string
  cityLabel?: string
  streetLabel?: string
  postalCodeLabel?: string
}

export function AddressSelector({
  country = "",
  province = "",
  city = "",
  street = "",
  postalCode = "",
  onCountryChange,
  onProvinceChange,
  onCityChange,
  onStreetChange,
  onPostalCodeChange,
  required = false,
  disabled = false,
  showStreet = true,
  showPostalCode = true,
  countryLabel = "País",
  provinceLabel = "Provincia",
  cityLabel = "Ciudad",
  streetLabel = "Calle y número",
  postalCodeLabel = "Código postal",
}: AddressSelectorProps) {
  const [selectedCountry, setSelectedCountry] = useState(country)
  const [selectedProvince, setSelectedProvince] = useState(province)
  const [selectedCity, setSelectedCity] = useState(city)
  const [customCity, setCustomCity] = useState("")
  const [availableCities, setAvailableCities] = useState<string[]>([])

  // Actualizar ciudades disponibles cuando cambia la provincia
  useEffect(() => {
    if (selectedCountry === "España" && selectedProvince) {
      setAvailableCities(citiesByProvince[selectedProvince] || [])
    } else {
      setAvailableCities([])
    }
  }, [selectedCountry, selectedProvince])

  // Manejar cambio de país
  const handleCountryChange = (value: string) => {
    setSelectedCountry(value)
    setSelectedProvince("")
    setSelectedCity("")
    setCustomCity("")
    onCountryChange?.(value)
    onProvinceChange?.("")
    onCityChange?.("")
  }

  // Manejar cambio de provincia
  const handleProvinceChange = (value: string) => {
    setSelectedProvince(value)
    setSelectedCity("")
    setCustomCity("")
    onProvinceChange?.(value)
    onCityChange?.("")
  }

  // Manejar cambio de ciudad
  const handleCityChange = (value: string) => {
    setSelectedCity(value)
    if (value !== "Otra") {
      setCustomCity("")
      onCityChange?.(value)
    }
  }

  // Manejar cambio de ciudad personalizada
  const handleCustomCityChange = (value: string) => {
    setCustomCity(value)
    onCityChange?.(value)
  }

  return (
    <div className="grid gap-4">
      {/* País */}
      <div className="grid gap-2">
        <Label htmlFor="country">
          {countryLabel} {required && "*"}
        </Label>
        <Select value={selectedCountry} onValueChange={handleCountryChange} disabled={disabled}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona país" />
          </SelectTrigger>
          <SelectContent>
            {hispanicCountries.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Provincia (solo para España) */}
      {selectedCountry === "España" && (
        <div className="grid gap-2">
          <Label htmlFor="province">
            {provinceLabel} {required && "*"}
          </Label>
          <Select value={selectedProvince} onValueChange={handleProvinceChange} disabled={disabled}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona provincia" />
            </SelectTrigger>
            <SelectContent>
              {spanishProvinces.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Ciudad - Solo mostrar si se ha seleccionado provincia (España) o país (otros) */}
      {((selectedCountry === "España" && selectedProvince) || (selectedCountry && selectedCountry !== "España")) && (
        <div className="grid gap-2">
          <Label htmlFor="city">
            {cityLabel} {required && "*"}
          </Label>
          {selectedCountry === "España" && selectedProvince && availableCities.length > 0 ? (
            <>
              <Select value={selectedCity} onValueChange={handleCityChange} disabled={disabled}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona ciudad" />
                </SelectTrigger>
                <SelectContent>
                  {availableCities.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCity === "Otra" && (
                <Input
                  placeholder="Escribe el nombre de la ciudad"
                  value={customCity}
                  onChange={(e) => handleCustomCityChange(e.target.value)}
                  disabled={disabled}
                  required={required}
                />
              )}
            </>
          ) : (
            <Input
              placeholder="Escribe el nombre de la ciudad"
              value={city}
              onChange={(e) => onCityChange?.(e.target.value)}
              disabled={disabled}
              required={required}
            />
          )}
        </div>
      )}

      {/* Calle (opcional) */}
      {showStreet && (
        <div className="grid gap-2">
          <Label htmlFor="street">
            {streetLabel} {required && "*"}
          </Label>
          <Input
            placeholder="Calle Mayor, 123"
            value={street}
            onChange={(e) => onStreetChange?.(e.target.value)}
            disabled={disabled}
            required={required}
          />
        </div>
      )}

      {/* Código postal (opcional) */}
      {showPostalCode && (
        <div className="grid gap-2">
          <Label htmlFor="postalCode">{postalCodeLabel}</Label>
          <Input
            placeholder="28001"
            value={postalCode}
            onChange={(e) => onPostalCodeChange?.(e.target.value)}
            disabled={disabled}
            maxLength={5}
          />
        </div>
      )}
    </div>
  )
}

export default AddressSelector
