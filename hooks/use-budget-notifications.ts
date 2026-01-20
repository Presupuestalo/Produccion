"use client"
import { supabase } from "@/lib/supabase/client"

export function useBudgetNotifications() {
  const subscribeToBudgetChanges = (budgetId: string, callback: () => void) => {
    if (!supabase) {
      console.log("[v0] Supabase client not available, skipping budget subscription")
      return () => {}
    }

    console.log("[v0] Subscribing to budget changes:", budgetId)

    const channel = supabase
      .channel(`budget-${budgetId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "budgets",
          filter: `id=eq.${budgetId}`,
        },
        (payload) => {
          console.log("[v0] Budget changed:", payload)
          callback()
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "budget_line_items",
          filter: `budget_id=eq.${budgetId}`,
        },
        (payload) => {
          console.log("[v0] Budget line item changed:", payload)
          callback()
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "budget_adjustments",
          filter: `budget_id=eq.${budgetId}`,
        },
        (payload) => {
          console.log("[v0] Budget adjustment changed:", payload)
          callback()
        },
      )
      .subscribe()

    return () => {
      console.log("[v0] Unsubscribing from budget changes:", budgetId)
      supabase.removeChannel(channel)
    }
  }

  return { subscribeToBudgetChanges }
}
