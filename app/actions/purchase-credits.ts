'use server'

import { stripe } from '@/lib/stripe'
import { CREDIT_PACKAGES } from '@/lib/credit-packages'
import { createClient } from '@/lib/supabase/server'

export async function startCreditPurchaseSession(packageId: string) {
  const supabase = await createClient()

  if (!supabase) {
    throw new Error('Configuración de servidor incompleta')
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('Usuario no autenticado')
  }

  const package_ = CREDIT_PACKAGES.find(p => p.id === packageId)
  if (!package_) {
    throw new Error(`Paquete con id "${packageId}" no encontrado`)
  }

  const session = await stripe.checkout.sessions.create({
    ui_mode: 'embedded',
    redirect_on_completion: 'never',
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: package_.name,
            description: `${package_.credits} créditos para Presmarket`,
          },
          unit_amount: package_.priceInCents,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    metadata: {
      user_id: user.id,
      package_id: packageId,
      credits_amount: package_.credits.toString(),
      type: 'credit_purchase'
    }
  })

  return session.client_secret
}
