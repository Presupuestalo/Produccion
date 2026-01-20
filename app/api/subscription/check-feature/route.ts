import { NextResponse, type NextRequest } from "next/server"
import { hasFeatureAccess } from "@/lib/subscription"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const feature = searchParams.get("feature")

  if (!feature) {
    return NextResponse.json({ error: "Feature parameter required" }, { status: 400 })
  }

  try {
    const hasAccess = await hasFeatureAccess(feature as any)
    return NextResponse.json({ hasAccess })
  } catch (error: any) {
    console.error("[v0] Error checking feature access:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
