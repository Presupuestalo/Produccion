export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    // Obtener IP del header (Vercel la proporciona)
    const forwardedFor = request.headers.get("x-forwarded-for")
    const ip = forwardedFor?.split(",")[0]?.trim() || "unknown"

    // Si es localhost o IP privada, devolver España por defecto
    if (ip === "unknown" || ip === "127.0.0.1" || ip.startsWith("192.168.") || ip.startsWith("10.")) {
      return NextResponse.json({ country: "ES", ip })
    }

    // Usar ip-api.com (gratuito, no requiere API key)
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode`)

    if (response.ok) {
      const data = await response.json()
      return NextResponse.json({
        country: data.countryCode || "ES",
        ip,
      })
    }

    return NextResponse.json({ country: "ES", ip })
  } catch (error) {
    console.error("[v0] Error detecting country:", error)
    return NextResponse.json({ country: "ES", ip: "unknown" })
  }
}

