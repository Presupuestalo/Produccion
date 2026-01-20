# Configuración de Créditos en Stripe

## Productos a Crear en Stripe Dashboard

Ve a https://dashboard.stripe.com/products y crea los siguientes productos:

### 1. Paquete 50 Créditos
- **Nombre**: 50 Créditos Presupuestalo
- **Descripción**: Paquete de 50 créditos para acceder a leads de clientes
- **Precio**: 49.00 EUR
- **Tipo**: Pago único (one-time)
- **Copiar el Price ID** y reemplazar `price_credits_50` en el código

### 2. Paquete 100 Créditos (POPULAR)
- **Nombre**: 100 Créditos Presupuestalo
- **Descripción**: Paquete de 100 créditos para acceder a leads de clientes
- **Precio**: 89.00 EUR
- **Tipo**: Pago único
- **Copiar el Price ID** y reemplazar `price_credits_100` en el código

### 3. Paquete 250 Créditos
- **Nombre**: 250 Créditos Presupuestalo
- **Descripción**: Paquete de 250 créditos para acceder a leads de clientes
- **Precio**: 199.00 EUR
- **Tipo**: Pago único
- **Copiar el Price ID** y reemplazar `price_credits_250` en el código

### 4. Paquete 500 Créditos
- **Nombre**: 500 Créditos Presupuestalo
- **Descripción**: Paquete de 500 créditos para acceder a leads de clientes
- **Precio**: 349.00 EUR
- **Tipo**: Pago único
- **Copiar el Price ID** y reemplazar `price_credits_500` en el código

## Archivos a Actualizar

Una vez creados los productos en Stripe, actualiza estos archivos con los Price IDs reales:

### `/app/api/credits/purchase/route.ts`
```typescript
const CREDIT_PACKAGE_TO_STRIPE_PRICE: Record<number, string> = {
  50: "price_XXXXXXXXXXXXX",  // Tu Price ID real
  100: "price_XXXXXXXXXXXXX",
  250: "price_XXXXXXXXXXXXX",
  500: "price_XXXXXXXXXXXXX",
}
```

### `/app/api/webhooks/stripe-credits/route.ts`
```typescript
const STRIPE_PRICE_TO_CREDITS: Record<string, { credits: number; price: number }> = {
  "price_XXXXXXXXXXXXX": { credits: 50, price: 49 },
  "price_XXXXXXXXXXXXX": { credits: 100, price: 89 },
  "price_XXXXXXXXXXXXX": { credits: 250, price: 199 },
  "price_XXXXXXXXXXXXX": { credits: 500, price: 349 },
}
```

## Configurar Webhook en Stripe

1. Ve a https://dashboard.stripe.com/webhooks
2. Click en "Add endpoint"
3. URL del endpoint: `https://tu-dominio.com/api/webhooks/stripe-credits`
4. Eventos a escuchar:
   - `checkout.session.completed`
5. Copiar el **Signing secret** y añadirlo a las variables de entorno

## Variables de Entorno

Ya tienes configurado:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_SITE_URL`

El webhook de créditos usa el mismo `STRIPE_WEBHOOK_SECRET` pero si quieres uno separado, puedes crear un webhook diferente.

## Testing

1. Crear los productos en Stripe (modo test primero)
2. Actualizar los Price IDs en el código
3. Configurar el webhook
4. Probar compra de créditos desde /dashboard/marketplace
5. Verificar que el balance se actualiza correctamente
6. Verificar transacciones en /api/credits/transactions
