import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    // Verificar si el usuario ya tiene precios
    const { data: existingPrices, error: checkError } = await supabase
      .from("price_master")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)

    if (checkError) {
      console.error("Error checking existing prices:", checkError)
      return NextResponse.json({ error: checkError.message }, { status: 500 })
    }

    if (existingPrices && existingPrices.length > 0) {
      return NextResponse.json({ message: "El usuario ya tiene precios", count: 0 }, { status: 200 })
    }

    // Copiar precios maestros al usuario
    const { data, error } = await supabase.rpc("copy_master_prices_to_user", {
      target_user_id: user.id,
    })

    if (error) {
      console.error("Error copying master prices:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: "Precios copiados exitosamente", count: data }, { status: 200 })
  } catch (error) {
    console.error("Error in copy-master-prices:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
