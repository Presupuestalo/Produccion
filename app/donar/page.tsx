import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-01-27.acacia" as any,
})

export default async function DonarPage() {
    redirect("/dashboard/planes?plan=plan-donacion")
}
