import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

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
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Obtener todos los planes
    const { data: plans, error } = await supabase
      .from('subscription_plans')
      .select('id, name, display_name, price_monthly')
      .order('sort_order')

    if (error) {
      console.error('[v0] Error obteniendo planes:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ plans })
  } catch (error) {
    console.error('[v0] Error en GET /api/admin/plans:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
