"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const COUNTRY_PHONE_DATA = [
  { code: "ES", name: "España", flag: "🇪🇸", dialCode: "+34" },
  { code: "MX", name: "México", flag: "🇲🇽", dialCode: "+52" },
  { code: "AR", name: "Argentina", flag: "🇦🇷", dialCode: "+54" },
  { code: "CO", name: "Colombia", flag: "🇨🇴", dialCode: "+57" },
  { code: "CL", name: "Chile", flag: "🇨🇱", dialCode: "+56" },
  { code: "PE", name: "Perú", flag: "🇵🇪", dialCode: "+51" },
  { code: "VE", name: "Venezuela", flag: "🇻🇪", dialCode: "+58" },
  { code: "EC", name: "Ecuador", flag: "🇪🇨", dialCode: "+593" },
  { code: "GT", name: "Guatemala", flag: "🇬🇹", dialCode: "+502" },
  { code: "CU", name: "Cuba", flag: "🇨🇺", dialCode: "+53" },
  { code: "BO", name: "Bolivia", flag: "🇧🇴", dialCode: "+591" },
  { code: "DO", name: "Rep. Dominicana", flag: "🇩🇴", dialCode: "+1" },
  { code: "HN", name: "Honduras", flag: "🇭🇳", dialCode: "+504" },
  { code: "PY", name: "Paraguay", flag: "🇵🇾", dialCode: "+595" },
  { code: "SV", name: "El Salvador", flag: "🇸🇻", dialCode: "+503" },
  { code: "NI", name: "Nicaragua", flag: "🇳🇮", dialCode: "+505" },
  { code: "CR", name: "Costa Rica", flag: "🇨🇷", dialCode: "+506" },
  { code: "PA", name: "Panamá", flag: "🇵🇦", dialCode: "+507" },
  { code: "UY", name: "Uruguay", flag: "🇺🇾", dialCode: "+598" },
  { code: "US", name: "Estados Unidos", flag: "🇺🇸", dialCode: "+1" },
  { code: "GB", name: "Reino Unido", flag: "🇬🇧", dialCode: "+44" },
  { code: "FR", name: "Francia", flag: "🇫🇷", dialCode: "+33" },
  { code: "DE", name: "Alemania", flag: "🇩🇪", dialCode: "+49" },
  { code: "IT", name: "Italia", flag: "🇮🇹", dialCode: "+39" },
  { code: "PT", name: "Portugal", flag: "🇵🇹", dialCode: "+351" },
  { code: "BR", name: "Brasil", flag: "🇧🇷", dialCode: "+55" },
]

interface CountryCodeSelectProps {
  value: string
  onChange: (value: string) => void
}

export default function CountryCodeSelect({ value, onChange }: CountryCodeSelectProps) {
  const selectedCountry = COUNTRY_PHONE_DATA.find((c) => c.dialCode === value) || COUNTRY_PHONE_DATA[0]

  return (
    <Select value={selectedCountry.dialCode} onValueChange={onChange}>
      <SelectTrigger className="w-[140px]">
        <SelectValue>
          <div className="flex items-center gap-2">
            <span className="text-xl">{selectedCountry.flag}</span>
            <span className="text-sm">{selectedCountry.dialCode}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-[300px]">
        {COUNTRY_PHONE_DATA.map((country) => (
          <SelectItem key={country.code} value={country.dialCode}>
            <div className="flex items-center gap-2">
              <span className="text-xl">{country.flag}</span>
              <span className="text-sm">{country.dialCode}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
