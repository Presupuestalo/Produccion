import { getSupabase } from "@/lib/supabase/client"

export interface SubscriptionLimits {
  maxProjects: number | null // null = unlimited
  maxBudgets: number | null // null = unlimited
  maxRooms: number | null // null = unlimited
  aiDailyLimit: number | null // null = unlimited
  maxCustomPrices: number | null
  aiPriceImport: boolean
  aiFloorPlanUpload: boolean
  pdfExport: boolean
  pdfWatermark: boolean
  templates: boolean
  quickEstimate: boolean
  budgetComparator: boolean
  designGenerator: boolean
  proVisualizer: boolean
  windowsFeature: boolean
  crm: boolean
  globalPercentageAdjuster: boolean
  appointmentNotifications: boolean
}

export interface UsageStats {
  currentProjects: number
  currentBudgets: number
  aiUsageToday: number
}

export interface AIUsageResult {
  allowed: boolean
  currentUsage: number
  dailyLimit: number | null
  remaining: number | null
  unlimited: boolean
  message?: string
}

const PLAN_LIMITS: Record<string, SubscriptionLimits> = {
  free: {
    maxProjects: 1,
    maxBudgets: 1,
    maxRooms: 3,
    aiDailyLimit: 3,
    maxCustomPrices: 0,
    aiPriceImport: false,
    aiFloorPlanUpload: false,
    pdfExport: true,
    pdfWatermark: true,
    templates: false,
    quickEstimate: true,
    budgetComparator: false,
    designGenerator: false,
    proVisualizer: false,
    windowsFeature: false,
    crm: false,
    globalPercentageAdjuster: false,
    appointmentNotifications: false,
  },
  basic: {
    maxProjects: null, // Ilimitado
    maxBudgets: 3,
    maxRooms: null, // Ilimitado
    aiDailyLimit: 5,
    maxCustomPrices: 100,
    aiPriceImport: false,
    aiFloorPlanUpload: false,
    pdfExport: true,
    pdfWatermark: false,
    templates: true,
    quickEstimate: true,
    budgetComparator: true,
    designGenerator: false,
    proVisualizer: false,
    windowsFeature: false,
    crm: false,
    globalPercentageAdjuster: true,
    appointmentNotifications: true,
  },
  pro: {
    maxProjects: null, // Ilimitado
    maxBudgets: 5,
    maxRooms: null, // Ilimitado
    aiDailyLimit: null, // Ilimitado
    maxCustomPrices: null,
    aiPriceImport: true,
    aiFloorPlanUpload: true,
    pdfExport: true,
    pdfWatermark: false,
    templates: true,
    quickEstimate: true,
    budgetComparator: true,
    designGenerator: true,
    proVisualizer: true,
    windowsFeature: true,
    crm: true,
    globalPercentageAdjuster: true,
    appointmentNotifications: true,
  },
}

/**
 * Get the user's current subscription plan and limits
 */
export async function getSubscriptionLimits(): Promise<SubscriptionLimits | null> {
  try {
    const supabase = await getSupabase()
    if (!supabase) {
      console.error("[v0] Supabase client not available")
      return getFreePlanLimits()
    }

    const { data: session } = await supabase.auth.getSession()
    if (!session.session) {
      return null
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("subscription_plan")
      .eq("id", session.session.user.id)
      .single()

    if (profileError) {
      console.error("[v0] Error getting subscription plan:", profileError)
      return getFreePlanLimits()
    }

    const planName = profile?.subscription_plan?.toLowerCase() || "free"
    return getPlanLimitsByName(planName)
  } catch (error) {
    console.error("[v0] Error getting subscription limits:", error)
    return getFreePlanLimits()
  }
}

/**
 * Get current usage statistics for the user
 */
export async function getUsageStats(): Promise<UsageStats | null> {
  try {
    const supabase = await getSupabase()
    if (!supabase) {
      console.error("[v0] Supabase client not available")
      return { currentProjects: 0, currentBudgets: 0, aiUsageToday: 0 }
    }

    const { data: session } = await supabase.auth.getSession()
    if (!session.session) {
      return null
    }

    // Count projects
    const { count: projectCount, error: projectError } = await supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("user_id", session.session.user.id)

    if (projectError) {
      console.error("[v0] Error counting projects:", projectError)
    }

    // Get AI usage today
    const { data: aiUsage } = await supabase.rpc("get_ai_daily_usage", {
      p_user_id: session.session.user.id,
    })

    return {
      currentProjects: projectCount || 0,
      currentBudgets: 0, // Se calculará por proyecto cuando sea necesario
      aiUsageToday: aiUsage?.current_usage || 0,
    }
  } catch (error) {
    console.error("[v0] Error getting usage stats:", error)
    return null
  }
}

/**
 * Check if user can create a new project
 */
export async function canCreateProject(): Promise<{ allowed: boolean; reason?: string }> {
  const limits = await getSubscriptionLimits()
  const usage = await getUsageStats()

  if (!limits || !usage) {
    return { allowed: false, reason: "No se pudo verificar los límites de suscripción" }
  }

  if (limits.maxProjects === null) {
    return { allowed: true }
  }

  if (usage.currentProjects >= limits.maxProjects) {
    return {
      allowed: false,
      reason: `Has alcanzado el límite de ${limits.maxProjects} proyecto${limits.maxProjects > 1 ? "s" : ""} de tu plan. Actualiza tu plan para crear más proyectos.`,
    }
  }

  return { allowed: true }
}

/**
 * Check if user can create a new budget in a project
 */
export async function canCreateBudget(
  projectId: string,
): Promise<{ allowed: boolean; reason?: string; currentCount?: number; limit?: number; canUpgrade?: boolean }> {
  try {
    const limits = await getSubscriptionLimits()
    if (!limits) {
      return { allowed: false, reason: "No se pudo verificar los límites de suscripción" }
    }

    // Si es ilimitado
    if (limits.maxBudgets === null) {
      return { allowed: true }
    }

    const supabase = await getSupabase()
    if (!supabase) {
      return { allowed: false, reason: "Error de conexión" }
    }

    // Get current plan to check if upgrade is possible
    const { data: session } = await supabase.auth.getSession()
    let canUpgrade = false
    if (session.session) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_plan")
        .eq("id", session.session.user.id)
        .single()

      const currentPlan = profile?.subscription_plan?.toLowerCase() || "free"
      canUpgrade = currentPlan === "free" || currentPlan === "basic"
    }

    // Contar presupuestos del proyecto
    const { count, error } = await supabase
      .from("budgets")
      .select("*", { count: "exact", head: true })
      .eq("project_id", projectId)

    if (error) {
      console.error("[v0] Error counting budgets:", error)
      return { allowed: true } // Permitir en caso de error
    }

    const currentCount = count || 0

    if (currentCount >= limits.maxBudgets) {
      return {
        allowed: false,
        reason: `Has alcanzado el límite de ${limits.maxBudgets} presupuesto${limits.maxBudgets > 1 ? "s" : ""} por proyecto de tu plan.`,
        currentCount,
        limit: limits.maxBudgets,
        canUpgrade
      }
    }

    return { allowed: true, currentCount, limit: limits.maxBudgets }
  } catch (error) {
    console.error("[v0] Error checking budget limit:", error)
    return { allowed: true }
  }
}

/**
 * Check if user can use AI tools and increment usage
 */
export async function canUseAITool(toolName?: string): Promise<AIUsageResult> {
  try {
    const supabase = await getSupabase()
    if (!supabase) {
      return {
        allowed: false,
        currentUsage: 0,
        dailyLimit: null,
        remaining: null,
        unlimited: false,
        message: "Error de conexión",
      }
    }

    const { data: session } = await supabase.auth.getSession()
    if (!session.session) {
      return {
        allowed: false,
        currentUsage: 0,
        dailyLimit: null,
        remaining: null,
        unlimited: false,
        message: "No autenticado",
      }
    }

    // Llamar a la función de la base de datos que incrementa y verifica
    const { data, error } = await supabase.rpc("increment_ai_usage", {
      p_user_id: session.session.user.id,
      p_tool_name: toolName || null,
    })

    if (error) {
      console.error("[v0] Error checking AI usage:", error)
      // En caso de error, permitir el uso
      return { allowed: true, currentUsage: 0, dailyLimit: null, remaining: null, unlimited: true }
    }

    return {
      allowed: data.allowed,
      currentUsage: data.current_usage || 0,
      dailyLimit: data.daily_limit,
      remaining: data.remaining,
      unlimited: data.unlimited || data.daily_limit === null,
      message: data.message,
    }
  } catch (error) {
    console.error("[v0] Error in canUseAITool:", error)
    return { allowed: true, currentUsage: 0, dailyLimit: null, remaining: null, unlimited: true }
  }
}

/**
 * Get current AI usage without incrementing
 */
export async function getAIUsageToday(): Promise<AIUsageResult> {
  try {
    const supabase = await getSupabase()
    if (!supabase) {
      return { allowed: true, currentUsage: 0, dailyLimit: null, remaining: null, unlimited: true }
    }

    const { data: session } = await supabase.auth.getSession()
    if (!session.session) {
      return { allowed: false, currentUsage: 0, dailyLimit: null, remaining: null, unlimited: false }
    }

    const { data, error } = await supabase.rpc("get_ai_daily_usage", {
      p_user_id: session.session.user.id,
    })

    if (error) {
      console.error("[v0] Error getting AI usage:", error)
      return { allowed: true, currentUsage: 0, dailyLimit: null, remaining: null, unlimited: true }
    }

    const dailyLimit = data.daily_limit
    const currentUsage = data.current_usage || 0

    return {
      allowed: dailyLimit === null || currentUsage < dailyLimit,
      currentUsage,
      dailyLimit,
      remaining: data.remaining,
      unlimited: data.unlimited || dailyLimit === null,
    }
  } catch (error) {
    console.error("[v0] Error in getAIUsageToday:", error)
    return { allowed: true, currentUsage: 0, dailyLimit: null, remaining: null, unlimited: true }
  }
}

/**
 * Check if user can add more rooms
 */
export async function canAddRoom(
  projectId: string,
  type?: "demolition" | "reform",
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const limits = await getSubscriptionLimits()
    if (!limits) {
      return { allowed: false, reason: "No se pudo verificar los límites de suscripción" }
    }

    // Si es ilimitado
    if (limits.maxRooms === null) {
      return { allowed: true }
    }

    if (!projectId) return { allowed: true }

    const supabase = await getSupabase()
    if (!supabase) return { allowed: true }

    // Obtener datos de la calculadora
    const { data, error } = await supabase
      .from("calculator_data")
      .select("rooms, reform_rooms")
      .eq("project_id", projectId)
      .maybeSingle()

    if (error) {
      console.error("[v0] Error obteniendo habitaciones:", error)
      return { allowed: true }
    }

    if (!data) return { allowed: true } // Nueva calculadora

    const roomsCount = ((data.rooms as any[]) || []).length
    const reformRoomsCount = ((data.reform_rooms as any[]) || []).length

    // Si especificamos el tipo, comprobamos ese tipo
    const currentCount = type === "demolition" ? roomsCount : type === "reform" ? reformRoomsCount : Math.max(roomsCount, reformRoomsCount)

    if (currentCount >= limits.maxRooms) {
      return {
        allowed: false,
        reason: `Has alcanzado el límite de ${limits.maxRooms} estancias de tu plan. Actualiza para añadir más.`,
      }
    }

    return { allowed: true }
  } catch (error) {
    console.error("[v0] Error in canAddRoom:", error)
    return { allowed: true }
  }
}

function getFreePlanLimits(): SubscriptionLimits {
  return PLAN_LIMITS.free
}

function getPlanLimitsByName(planName: string): SubscriptionLimits {
  const normalized = (planName || "free").toLowerCase().trim()

  if (
    normalized === "business" ||
    normalized === "enterprise" ||
    normalized === "pro" ||
    normalized === "premium" ||
    normalized === "professional" ||
    normalized === "profesional"
  ) {
    return PLAN_LIMITS.pro
  }

  if (normalized === "basic" || normalized === "basico") {
    return PLAN_LIMITS.basic
  }

  return PLAN_LIMITS[normalized] || PLAN_LIMITS.free
}
