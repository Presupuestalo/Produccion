# Flujo de Landing Lead - Estimación a Presmarket

Este documento describe el flujo completo desde que un usuario solicita una estimación de presupuesto hasta que se convierte en una oferta en el Presmarket.

## Flujo General

```
[Usuario] → Estimación Rápida
    ↓
[Sistema] → Genera rango precio (ej: 15.000€ - 20.000€)
    ↓
[Usuario] → Click "Solicitar Presupuestos"
    ↓
[Modal] → Formulario: Email + Nombre + Teléfono + Términos
    ↓
[Twilio] → Envía SMS con código de 6 dígitos
    ↓
[Usuario] → Introduce código de verificación
    ↓
[Validación] → Verifica si teléfono ya tiene solicitud activa
    ↓ (Si no existe)
[Sistema] → Crea cuenta automática (tipo: owner)
    ↓
[Sistema] → Crea proyecto temporal
    ↓
[Sistema] → Crea lead_request (tipo: normal)
    ↓
[Emails] → Envía credenciales + confirmación
    ↓
[Presmarket] → Oferta visible para empresas (máx 3)
```

## Tipos de Leads

### Normal (Landing)
- Origen: Estimación rápida
- Usuario: Creado automáticamente
- Cuenta: Generada con contraseña temporal
- Límite: 1 solicitud activa por teléfono

### Premium (Calculadora)
- Origen: Calculadora completa
- Usuario: Registrado manualmente
- Cuenta: Creada por el usuario
- Límite: Sin límite

## Archivos del Sistema

### Backend APIs
- `/app/api/ia/create-landing-lead/route.ts` - Crear lead desde landing
- `/app/api/sms/send-verification-public/route.ts` - Enviar SMS verificación
- `/app/api/sms/verify-code/route.ts` - Verificar código SMS
- `/app/api/email/welcome-account/route.ts` - Email de bienvenida
- `/app/api/email/lead-published/route.ts` - Email confirmación

### Frontend Components
- `/app/dashboard/ia/estimacion-rapida/page.tsx` - Página estimación
- `/components/leads/phone-verification-modal.tsx` - Modal verificación

### Database Scripts
- `/scripts/add-lead-type-column.sql` - Añade columna lead_type y tabla phone_verifications

### Utilities
- `/lib/utils/password-generator.ts` - Generador de contraseñas seguras

## Base de Datos

### Columna: lead_type
```sql
ALTER TABLE lead_requests ADD COLUMN lead_type TEXT DEFAULT 'normal' 
CHECK (lead_type IN ('normal', 'premium'));
```

### Tabla: phone_verifications
```sql
CREATE TABLE IF NOT EXISTS phone_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone TEXT NOT NULL,
  verified_at TIMESTAMPTZ DEFAULT NOW(),
  lead_request_id UUID REFERENCES lead_requests(id),
  UNIQUE(phone, lead_request_id)
);
```

## Emails Enviados

### 1. Email de Bienvenida
**Asunto:** Tu cuenta en Presupuestalo - Accede a tu solicitud

**Contenido:**
- Credenciales de acceso (email + contraseña temporal)
- Link directo al dashboard
- Instrucciones para cambiar contraseña

### 2. Email de Confirmación
**Asunto:** Tu solicitud está publicada - Esperando empresas

**Contenido:**
- Resumen del proyecto
- Presupuesto estimado
- Estado de la solicitud
- Límite de 3 empresas

## Validaciones

1. Campos obligatorios: email, nombre, teléfono
2. Términos y privacidad aceptados
3. Teléfono español (+34)
4. Código SMS válido
5. Máximo 1 solicitud activa por teléfono
6. Email único (si existe, usa cuenta existente)

## Seguridad

- Contraseñas seguras de 12 caracteres
- Verificación SMS con Twilio
- Términos y privacidad obligatorios
- Límite por teléfono verificado
- Expiración de leads: 30 días

## Testing

Para probar el flujo completo:

1. Ir a `/dashboard/ia/estimacion-rapida`
2. Rellenar formulario de estimación
3. Click en "Solicitar Presupuestos"
4. Introducir datos y verificar teléfono
5. Verificar emails recibidos
6. Comprobar lead en Presmarket
7. Login con credenciales recibidas

## Troubleshooting

### Error: "Ya tienes una solicitud activa"
- El teléfono ya tiene un lead abierto
- Esperar a que se cierre o use otro teléfono

### Error: "Error al crear la cuenta"
- Verificar que el email no exista
- Comprobar conexión con Supabase Auth

### Error: "Error al enviar SMS"
- Verificar configuración de Twilio
- Comprobar formato de teléfono (+34...)
