
import { getSupabase } from "@/lib/supabase/client"
import { FloorPlanVersion, FloorPlanData, FloorPlanVariant } from "@/lib/types/floor-plan"
import { v4 as uuidv4 } from "uuid"

export async function getProjectFloorPlans(projectId: string): Promise<FloorPlanVersion[]> {
  const supabase = await getSupabase()
  if (!supabase) return []

  const { data, error } = await supabase
    .from("project_floor_plans")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching floor plans:", error)
    return []
  }

  return (data || []).map((plan: any) => ({
    id: plan.id,
    project_id: plan.project_id,
    variant: plan.variant || (plan.plan_type === 'before' ? 'current' : 'proposal'), // Backwards compatibility
    name: plan.name || (plan.plan_type === 'before' ? 'Estado Actual' : 'Propuesta'),
    description: plan.description,
    data: plan.data || { walls: [], rooms: [], doors: [], windows: [] }, // Default empty data
    image_url: plan.image_url,
    created_at: plan.created_at || plan.updated_at
  }))
}

export async function saveFloorPlan(
  projectId: string,
  variant: FloorPlanVariant,
  name: string,
  data: FloorPlanData,
  imageUrl: string, // Screenshot URL
  id?: string // Update existing
): Promise<FloorPlanVersion | null> {
  const supabase = await getSupabase()
  if (!supabase) return null

  const { data: sessionData } = await supabase.auth.getSession()
  const userId = sessionData.session?.user.id
  if (!userId) return null

  // Ensure data has the correct structure for JSONB
  const safeData = JSON.parse(JSON.stringify(data))

  const payload: any = {
    project_id: projectId,
    user_id: userId,
    variant,
    name,
    data: safeData,
    image_url: imageUrl,
    // Legacy support
    plan_type: variant === 'current' ? 'before' : 'after'
  }

  if (id) {
    // Update
    const { data: result, error } = await supabase
      .from("project_floor_plans")
      .update(payload)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating floor plan:", error)
      throw error
    }
    return result as any
  } else {
    // Create
    const { data: result, error } = await supabase
      .from("project_floor_plans")
      .insert(payload)
      .select()
      .single()

    if (error) {
      console.error("Error creating floor plan:", error)
      throw error
    }
    return result as any
  }
}

export async function duplicateFloorPlan(sourcePlanId: string, newName: string): Promise<FloorPlanVersion | null> {
  const supabase = await getSupabase()
  if (!supabase) return null

  // 1. Get source plan
  const { data: source, error: sourceError } = await supabase
    .from("project_floor_plans")
    .select("*")
    .eq("id", sourcePlanId)
    .single()

  if (sourceError || !source) {
    console.error("Error fetching source plan for duplication:", sourceError)
    throw new Error("Plan original no encontrado")
  }

  // 2. Insert copy
  const { data: newPlan, error: insertError } = await supabase
    .from("project_floor_plans")
    .insert({
      ...source,
      id: undefined, // Let DB generate ID
      name: newName,
      variant: 'proposal', // Duplicates are usually proposals
      created_at: undefined,
      updated_at: undefined
    })
    .select()
    .single()

  if (insertError) {
    console.error("Error duplicating plan:", insertError)
    throw insertError
  }

  return newPlan as any
}

export async function deleteFloorPlan(id: string): Promise<boolean> {
  const supabase = await getSupabase()
  if (!supabase) return false

  const { error } = await supabase
    .from("project_floor_plans")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Error deleting plan:", error)
    return false
  }

  return true
}
