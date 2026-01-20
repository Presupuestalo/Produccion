import { supabase } from "@/lib/supabase/client"

export type Currency = {
  code: string
  symbol: string
  name: string
}

export type Country = {
  code: string
  name: string
  currency: Currency
}

export const CURRENCIES: Record<string, Currency> = {
  EUR: {
    code: "EUR",
    symbol: "€",
    name: "Euro",
  },
  USD: {
    code: "USD",
    symbol: "$",
    name: "Dólar estadounidense",
  },
  GBP: {
    code: "GBP",
    symbol: "£",
    name: "Libra esterlina",
  },
  MXN: {
    code: "MXN",
    symbol: "$",
    name: "Peso mexicano",
  },
  COP: {
    code: "COP",
    symbol: "$",
    name: "Peso colombiano",
  },
  ARS: {
    code: "ARS",
    symbol: "$",
    name: "Peso argentino",
  },
  PEN: {
    code: "PEN",
    symbol: "S/",
    name: "Sol peruano",
  },
  CLP: {
    code: "CLP",
    symbol: "$",
    name: "Peso chileno",
  },
  BOB: {
    code: "BOB",
    symbol: "Bs.",
    name: "Boliviano",
  },
  VES: {
    code: "VES",
    symbol: "Bs.",
    name: "Bolívar",
  },
  GTQ: {
    code: "GTQ",
    symbol: "Q",
    name: "Quetzal guatemalteco",
  },
  CUP: {
    code: "CUP",
    symbol: "$",
    name: "Peso cubano",
  },
  DOP: {
    code: "DOP",
    symbol: "RD$",
    name: "Peso dominicano",
  },
  HNL: {
    code: "HNL",
    symbol: "L",
    name: "Lempira hondureño",
  },
  PYG: {
    code: "PYG",
    symbol: "₲",
    name: "Guaraní paraguayo",
  },
  NIO: {
    code: "NIO",
    symbol: "C$",
    name: "Córdoba nicaragüense",
  },
  CRC: {
    code: "CRC",
    symbol: "₡",
    name: "Colón costarricense",
  },
  PAB: {
    code: "PAB",
    symbol: "B/.",
    name: "Balboa panameño",
  },
  UYU: {
    code: "UYU",
    symbol: "$U",
    name: "Peso uruguayo",
  },
  XAF: {
    code: "XAF",
    symbol: "FCFA",
    name: "Franco CFA",
  },
}

export const COUNTRIES: Record<string, Country> = {
  ES: {
    code: "ES",
    name: "España",
    currency: CURRENCIES.EUR,
  },
  US: {
    code: "US",
    name: "Estados Unidos",
    currency: CURRENCIES.USD,
  },
  GB: {
    code: "GB",
    name: "Reino Unido",
    currency: CURRENCIES.GBP,
  },
  MX: {
    code: "MX",
    name: "México",
    currency: CURRENCIES.MXN,
  },
  CO: {
    code: "CO",
    name: "Colombia",
    currency: CURRENCIES.COP,
  },
  AR: {
    code: "AR",
    name: "Argentina",
    currency: CURRENCIES.ARS,
  },
  PE: {
    code: "PE",
    name: "Perú",
    currency: CURRENCIES.PEN,
  },
  CL: {
    code: "CL",
    name: "Chile",
    currency: CURRENCIES.CLP,
  },
  BO: {
    code: "BO",
    name: "Bolivia",
    currency: CURRENCIES.BOB,
  },
  VE: {
    code: "VE",
    name: "Venezuela",
    currency: CURRENCIES.VES,
  },
  EC: {
    code: "EC",
    name: "Ecuador",
    currency: CURRENCIES.USD, // Ecuador usa dólar
  },
  GT: {
    code: "GT",
    name: "Guatemala",
    currency: CURRENCIES.GTQ,
  },
  CU: {
    code: "CU",
    name: "Cuba",
    currency: CURRENCIES.CUP,
  },
  DO: {
    code: "DO",
    name: "República Dominicana",
    currency: CURRENCIES.DOP,
  },
  HN: {
    code: "HN",
    name: "Honduras",
    currency: CURRENCIES.HNL,
  },
  PY: {
    code: "PY",
    name: "Paraguay",
    currency: CURRENCIES.PYG,
  },
  NI: {
    code: "NI",
    name: "Nicaragua",
    currency: CURRENCIES.NIO,
  },
  SV: {
    code: "SV",
    name: "El Salvador",
    currency: CURRENCIES.USD, // El Salvador usa dólar
  },
  CR: {
    code: "CR",
    name: "Costa Rica",
    currency: CURRENCIES.CRC,
  },
  PA: {
    code: "PA",
    name: "Panamá",
    currency: CURRENCIES.PAB,
  },
  UY: {
    code: "UY",
    name: "Uruguay",
    currency: CURRENCIES.UYU,
  },
  GQ: {
    code: "GQ",
    name: "Guinea Ecuatorial",
    currency: CURRENCIES.XAF,
  },
}

export async function getUserCountryFromProfile(): Promise<Country> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return COUNTRIES.ES // Por defecto España
    }

    const { data: profile, error } = await supabase.from("profiles").select("country").eq("id", user.id).single()

    if (error || !profile) {
      console.error("[v0] Error al obtener perfil del usuario:", error)
      return COUNTRIES.ES
    }

    const countryCode = profile.country || "ES"
    console.log("[v0] País del usuario desde perfil:", countryCode)
    return COUNTRIES[countryCode] || COUNTRIES.ES
  } catch (error) {
    console.error("[v0] Error al obtener país del usuario:", error)
    return COUNTRIES.ES
  }
}

export async function getUserCountryAsync(): Promise<Country> {
  return await getUserCountryFromProfile()
}

export function getUserCountry(): Country {
  if (typeof window === "undefined") return COUNTRIES.ES

  // Intentar leer del localStorage como cache
  const savedCountry = localStorage.getItem("user_country")
  return COUNTRIES[savedCountry || "ES"] || COUNTRIES.ES
}

// Guardar el país del usuario en localStorage como cache
export function setUserCountry(countryCode: string) {
  if (typeof window === "undefined") return

  localStorage.setItem("user_country", countryCode)
  window.dispatchEvent(new Event("country-changed"))
}

// Formatear precio con el símbolo de moneda correcto
export function formatPrice(price: number, targetCountry?: Country): string {
  const country = targetCountry || getUserCountry()

  // Los precios ya están en la moneda correcta de cada país, solo formateamos
  return `${price.toFixed(2)} ${country.currency.symbol}`
}

// Obtener símbolo de moneda
export function getCurrencySymbol(targetCountry?: Country | string): string {
  if (!targetCountry) {
    const country = getUserCountry()
    return country.currency.symbol
  }

  if (typeof targetCountry === "string") {
    const country = COUNTRIES[targetCountry]
    return country ? country.currency.symbol : "€"
  }

  return targetCountry.currency.symbol
}

// Additional updates can be added here if necessary
