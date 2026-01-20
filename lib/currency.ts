export type Currency = "EUR" | "GBP" | "USD" | "MXN" | "ARS" | "CLP" | "COP" | "PEN"

const CURRENCY_BY_COUNTRY: Record<string, Currency> = {
  España: "EUR",
  Francia: "EUR",
  Portugal: "EUR",
  Italia: "EUR",
  Alemania: "EUR",
  "Reino Unido": "GBP",
  "Estados Unidos": "USD",
  México: "MXN",
  Argentina: "ARS",
  Chile: "CLP",
  Colombia: "COP",
  Perú: "PEN",
}

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  EUR: "€",
  GBP: "£",
  USD: "$",
  MXN: "$",
  ARS: "$",
  CLP: "$",
  COP: "$",
  PEN: "S/",
}

export function getCurrencyForCountry(country: string): Currency {
  return CURRENCY_BY_COUNTRY[country] || "EUR"
}

export function getCurrencySymbolForCountry(country: string): string {
  const currency = getCurrencyForCountry(country)
  return CURRENCY_SYMBOLS[currency]
}

export function formatCurrency(amount: number, country: string): string {
  const currency = getCurrencyForCountry(country)
  const symbol = CURRENCY_SYMBOLS[currency]

  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: currency,
  })
    .format(amount)
    .replace(currency, symbol)
}
