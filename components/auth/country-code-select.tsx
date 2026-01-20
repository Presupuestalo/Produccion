"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const COUNTRY_CODES = [
  { country: "España", code: "+34", flag: "🇪🇸" },
  { country: "Francia", code: "+33", flag: "🇫🇷" },
  { country: "Portugal", code: "+351", flag: "🇵🇹" },
  { country: "Italia", code: "+39", flag: "🇮🇹" },
  { country: "Alemania", code: "+49", flag: "🇩🇪" },
  { country: "Reino Unido", code: "+44", flag: "🇬🇧" },
  { country: "Estados Unidos", code: "+1", flag: "🇺🇸" },
  { country: "México", code: "+52", flag: "🇲🇽" },
  { country: "Argentina", code: "+54", flag: "🇦🇷" },
  { country: "Chile", code: "+56", flag: "🇨🇱" },
  { country: "Colombia", code: "+57", flag: "🇨🇴" },
  { country: "Perú", code: "+51", flag: "🇵🇪" },
]

interface CountryCodeSelectProps {
  value: string
  onValueChange: (value: string) => void
  disabled?: boolean
}

export function CountryCodeSelect({ value, onValueChange, disabled }: CountryCodeSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className="w-[120px]">
        <SelectValue placeholder="Código" />
      </SelectTrigger>
      <SelectContent>
        {COUNTRY_CODES.map((item) => (
          <SelectItem key={item.code} value={item.code}>
            <span className="flex items-center gap-2">
              <span>{item.flag}</span>
              <span>{item.code}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
