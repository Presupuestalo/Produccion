import { createServerClient } from "@/lib/supabase/server"

export interface SubscriptionPlan {
  id: string
  name: string
  display_name: string
  max_projects: number | null
  max_rooms: number | null
  max_custom_prices: number | null
  ai_price_import: boolean
  ai_floor_plan_upload: boolean
  pdf_export: boolean
  pdf_watermark: boolean
  templates: boolean
  quick_estimate: boolean
  budget_comparator: boolean
  design_generator: boolean
  pro_visualizer: boolean
  windows_feature: boolean
  crm: boolean
  global_percentage_adjuster: boolean
}

export async function getUserSubscriptionPlan(): Promise<SubscriptionPlan | null> {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(`
      subscription_plan_id,
      subscription_plans (*)
    `)
    .eq("id", user.id)
    .single()

  if (!profile?.subscription_plans) {
    // Si no tiene plan, devolver el plan gratuito
    const { data: freePlan } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("name", "free")
      .order("sort_order", { ascending: true })
      .single()

    return freePlan as SubscriptionPlan
  }

  return profile.subscription_plans as any as SubscriptionPlan
}

export async function hasFeatureAccess(feature: keyof SubscriptionPlan): Promise<boolean> {
  const plan = await getUserSubscriptionPlan()

  if (!plan) {
    return false
  }

  return Boolean(plan[feature])
}

export async function checkUsageLimit(
  limitType: "projects" | "rooms" | "custom_prices",
  currentCount: number,
): Promise<{ allowed: boolean; limit: number | null }> {
  const plan = await getUserSubscriptionPlan()

  if (!plan) {
    return { allowed: false, limit: 0 }
  }

  let limit: number | null = null

  switch (limitType) {
    case "projects":
      limit = plan.max_projects
      break
    case "rooms":
      limit = plan.max_rooms
      break
    case "custom_prices":
      limit = plan.max_custom_prices
      break
  }

  // null significa ilimitado
  if (limit === null) {
    return { allowed: true, limit: null }
  }

  return { allowed: currentCount < limit, limit }
}
