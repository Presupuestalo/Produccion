import { NextResponse } from "next/server"
import { getUserSubscriptionPlan } from "@/lib/subscription"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const plan = await getUserSubscriptionPlan()
    
    if (!plan) {
      return NextResponse.json({ error: "No subscription plan found" }, { status: 404 })
    }

    return NextResponse.json(plan)
  } catch (error) {
    console.error("Error fetching subscription plan:", error)
    return NextResponse.json({ error: "Failed to fetch subscription plan" }, { status: 500 })
  }
}
