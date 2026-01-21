import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const supabase = await createClient()

  if (!supabase) {
    return NextResponse.json({ error: 'Configuración de servidor incompleta' }, { status: 500 })
  }

  // Verificar que el usuario es admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { userId, plan } = await request.json()

  // Mapear plan a valores de Stripe ficticios
  const planMapping: Record<string, { customerId: string | null, subscriptionId: string | null }> = {
    'free': { customerId: null, subscriptionId: null },
    'basic': { customerId: 'cus_test_basic', subscriptionId: 'sub_test_basic' },
    'pro': { customerId: 'cus_test_pro', subscriptionId: 'sub_test_pro' },
    'empresa': { customerId: 'cus_test_empresa', subscriptionId: 'sub_test_empresa' }
  }

  const stripeData = planMapping[plan]
  if (!stripeData) {
    return NextResponse.json({ error: 'Plan inválido' }, { status: 400 })
  }

  // Actualizar el usuario
  const { error } = await supabase
    .from('profiles')
    .update({
      stripe_customer_id: stripeData.customerId,
      stripe_subscription_id: stripeData.subscriptionId,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, plan, userId })
}
