export const dynamic = "force-dynamic"
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    if (!supabase) {
      return NextResponse.json({ error: 'Configuración de servidor incompleta' }, { status: 500 })
    }

    // Verificar que el usuario actual es admin
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verificar si es admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, email')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Obtener todos los usuarios con sus planes
    const { data: users, error } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        user_type,
        professional_role,
        subscription_plan_id,
        is_admin,
        is_donor,
        country,
        created_at,
        subscription_plans (
          id,
          name,
          display_name
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[v0] Error obteniendo usuarios:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ users })
  } catch (error) {
    console.error('[v0] Error en GET /api/admin/users:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()

    if (!supabase) {
      return NextResponse.json({ error: 'Configuración de servidor incompleta' }, { status: 500 })
    }
    const { userId, planId } = await request.json()

    // Verificar que el usuario actual es admin
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verificar si es admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Actualizar el plan del usuario
    const { error } = await supabase
      .from('profiles')
      .update({ subscription_plan_id: planId })
      .eq('id', userId)

    if (error) {
      console.error('[v0] Error actualizando plan:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Error en PATCH /api/admin/users:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

