/**
 * Formatea un número como moneda en euros
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true,
  }).format(amount)
}

/**
 * Formatea un número con separadores de miles
 */
export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: true,
  }).format(value)
}

/**
 * Formatea un valor de input numérico para mostrar siempre 2 decimales con coma
 * Convierte "5" en "5,00", "5.5" en "5,50", etc.
 */
export function formatDecimalInput(value: string | number): string {
  // Convertir a número
  const num = typeof value === "string" ? Number.parseFloat(value.replace(",", ".")) : value

  // Si no es un número válido, retornar "0,00"
  if (isNaN(num)) {
    return "0,00"
  }

  // Formatear con es-ES para asegurar la coma decimal y el punto de miles si fuera necesario
  // Nota: Para inputs solemos preferir solo decimales, pero el usuario pidió ver los miles con punto
  return new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true,
  }).format(num)
}

/**
 * Parsea un valor de input con coma o punto decimal a número
 * Convierte "5,50" o "5.50" a 5.5
 */
export function parseDecimalInput(value: string): number {
  const sanitized = value.replace(",", ".")
  const num = Number.parseFloat(sanitized)
  return isNaN(num) ? 0 : num
}

/**
 * Sanitiza un input numérico para permitir solo números, coma y punto
 * Reemplaza múltiples separadores decimales
 */
export function sanitizeDecimalInput(value: string): string {
  // Permitir solo números, coma y punto
  let sanitized = value.replace(/[^\d,.-]/g, "")

  // Reemplazar punto por coma
  sanitized = sanitized.replace(".", ",")

  // Si hay múltiples comas, mantener solo la primera
  const parts = sanitized.split(",")
  if (parts.length > 2) {
    sanitized = parts[0] + "," + parts.slice(1).join("")
  }

  return sanitized
}
