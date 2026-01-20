"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Globe } from "lucide-react"
import { COUNTRIES, getUserCountry, setUserCountry, type Country } from "@/lib/services/currency-service"

export function CountrySelector() {
  const [selectedCountry, setSelectedCountry] = useState<Country>(getUserCountry())

  useEffect(() => {
    const handleCountryChange = () => {
      setSelectedCountry(getUserCountry())
    }

    window.addEventListener("country-changed", handleCountryChange)
    return () => window.removeEventListener("country-changed", handleCountryChange)
  }, [])

  const handleCountrySelect = (countryCode: string) => {
    setUserCountry(countryCode)
    setSelectedCountry(COUNTRIES[countryCode])
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
          <Globe className="w-4 h-4" />
          {selectedCountry.name} ({selectedCountry.currency.symbol})
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {Object.values(COUNTRIES).map((country) => (
          <DropdownMenuItem key={country.code} onClick={() => handleCountrySelect(country.code)}>
            <div className="flex flex-col">
              <span className="font-medium">{country.name}</span>
              <span className="text-xs text-gray-500">
                {country.currency.name} ({country.currency.symbol})
              </span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
