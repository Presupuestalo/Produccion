export const dynamic = "force-dynamic"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { NextResponse } from "next/server"

// POST /api/validate-email - Validar email y teléfono antes de registro
export async function POST(request: Request) {
  try {
    const { email, phone } = await request.json()

    console.log("[v0] Validating email and phone:", { email, phone })

    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    const { data: existingProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, email")
      .ilike("email", normalizedEmail)
      .maybeSingle()

    if (profileError) {
      console.error("[v0] Error checking email in profiles:", profileError)
    }

    if (existingProfile) {
      console.log("[v0] Email already exists in profiles:", normalizedEmail)
      return NextResponse.json(
        {
          error: "Este email ya está registrado. Por favor inicia sesión o usa otro email.",
          exists: true,
        },
        { status: 409 },
      )
    }

    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()

    console.log("[v0] Auth users query result:", {
      usersCount: authUsers?.users?.length || 0,
      error: authError?.message,
    })

    if (!authError && authUsers?.users) {
      const existingAuthUser = authUsers.users.find((u) => u.email?.toLowerCase() === normalizedEmail)
      if (existingAuthUser) {
        console.log("[v0] Email already exists in auth.users:", normalizedEmail)
        return NextResponse.json(
          {
            error: "Este email ya está registrado. Por favor inicia sesión o usa otro email.",
            exists: true,
          },
          { status: 409 },
        )
      }
    }

    if (phone) {
      let formattedPhone = phone.trim()
      if (!formattedPhone.startsWith("+")) {
        formattedPhone = "+34" + formattedPhone.replace(/^0+/, "")
      }

      // Check for active lead with this phone
      const { data: existingLead } = await supabaseAdmin
        .from("lead_requests")
        .select("id, status")
        .eq("client_phone", formattedPhone)
        .in("status", ["open", "in_progress"])
        .maybeSingle()

      if (existingLead) {
        console.log("[v0] Phone already has active lead:", formattedPhone)
        return NextResponse.json(
          {
            error: "Ya tienes una solicitud activa con este teléfono. Solo se permite una solicitud por teléfono.",
            exists: true,
          },
          { status: 409 },
        )
      }

      // Check if phone exists in profiles
      const { data: existingPhoneProfile } = await supabaseAdmin
        .from("profiles")
        .select("id, phone")
        .eq("phone", formattedPhone)
        .maybeSingle()

      if (existingPhoneProfile) {
        console.log("[v0] Phone already exists in profiles:", formattedPhone)
        return NextResponse.json(
          {
            error: "Este teléfono ya está registrado. Por favor inicia sesión o usa otro teléfono.",
            exists: true,
          },
          { status: 409 },
        )
      }
    }

    console.log("[v0] Email and phone available:", { email: normalizedEmail, phone })
    return NextResponse.json({ available: true })
  } catch (error: any) {
    console.error("[v0] Error in validate-email:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
