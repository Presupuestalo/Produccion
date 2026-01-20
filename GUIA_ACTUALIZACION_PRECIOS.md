# Guía de Actualización de Bases de Datos de Precios Maestros por País

## 🌍 Sistema de Precios Multi-País

La aplicación utiliza un sistema de precios maestros que soporta múltiples países con sus respectivas monedas y conversiones de precios.

## 📊 Arquitectura Actual

### Opción A: Tabla Centralizada `price_master_by_country` (Recomendada)

**Ventajas:**
- ✅ Una sola tabla para todos los países
- ✅ Fácil mantenimiento y actualizaciones
- ✅ Consultas más eficientes
- ✅ Menos duplicación de datos

**Estructura:**
```sql
CREATE TABLE price_master_by_country (
  id UUID PRIMARY KEY,
  price_master_id TEXT NOT NULL,  -- Referencia al precio base
  country_code TEXT NOT NULL,      -- ES, US, MX, CO, AR, etc.
  currency_code TEXT NOT NULL,     -- EUR, USD, MXN, COP, ARS, etc.
  final_price DECIMAL(10,2),       -- Precio en moneda local
  localized_name TEXT,             -- Nombre localizado (ej: "Drywall" en vez de "Tabique")
  localized_description TEXT,      -- Descripción localizada
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(price_master_id, country_code)
);
```

### Opción B: Tablas Separadas por País (Legacy)

**Ventajas:**
- ✅ Aislamiento completo por país
- ✅ Personalización total de estructura si es necesaria

**Estructura:**
- `price_master` (España - EUR)
- `price_master_peru` (Perú - PEN)
- `price_master_mexico` (México - MXN)
- `price_master_colombia` (Colombia - COP)
- `price_master_argentina` (Argentina - ARS)
- etc.

## 🔧 Cómo Añadir un Nuevo País

### Paso 1: Añadir Moneda en `currency-service.ts`

```typescript
// Si la moneda no existe, añadirla a CURRENCIES:
export const CURRENCIES: Record<string, Currency> = {
  // ... existentes ...
  BRL: {
    code: "BRL",
    symbol: "R$",
    name: "Real brasileño",
  },
}
```

### Paso 2: Añadir País en `currency-service.ts`

```typescript
export const COUNTRIES: Record<string, Country> = {
  // ... existentes ...
  BR: {
    code: "BR",
    name: "Brasil",
    currency: CURRENCIES.BRL,
  },
}
```

### Paso 3: Añadir Etiquetas de Campos en `country-fields.ts`

```typescript
export const COUNTRY_FIELD_LABELS = {
  // ... existentes ...
  BR: { province: "Estado", postalCode: "CEP" },
}
```

### Paso 4A: Insertar Precios en Tabla Centralizada (Recomendado)

```sql
-- Script: scripts/add-brazil-prices.sql

-- Insertar precios para Brasil (BRL)
-- Conversión aproximada: 1 EUR = 5.5 BRL
INSERT INTO price_master_by_country (
  price_master_id, 
  country_code, 
  currency_code, 
  final_price,
  localized_name,
  localized_description,
  is_active
)
SELECT 
  id,
  'BR',
  'BRL',
  ROUND(final_price * 5.5, 2),
  CASE 
    WHEN name ILIKE '%tabique%' THEN REPLACE(name, 'TABIQUE', 'DRYWALL')
    WHEN name ILIKE '%alicatado%' THEN REPLACE(name, 'ALICATADO', 'AZULEJO')
    WHEN name ILIKE '%rodapié%' THEN REPLACE(name, 'RODAPIÉ', 'RODAPÉ')
    ELSE name
  END,
  CASE 
    WHEN description ILIKE '%tabique%' THEN REPLACE(description, 'tabique', 'drywall')
    WHEN description ILIKE '%alicatado%' THEN REPLACE(description, 'alicatado', 'azulejo')
    WHEN description ILIKE '%rodapié%' THEN REPLACE(description, 'rodapié', 'rodapé')
    ELSE description
  END,
  true
FROM price_master
WHERE is_active = true AND is_custom = false
ON CONFLICT (price_master_id, country_code) 
DO UPDATE SET 
  final_price = EXCLUDED.final_price,
  localized_name = EXCLUDED.localized_name,
  localized_description = EXCLUDED.localized_description,
  updated_at = NOW();
```

### Paso 4B: Crear Tabla Separada (Legacy)

```sql
-- Script: scripts/create-price-master-brazil.sql

-- Crear tabla específica para Brasil
CREATE TABLE price_master_brazil (
  LIKE price_master INCLUDING ALL
);

-- Copiar precios base y convertir
INSERT INTO price_master_brazil
SELECT 
  id,
  code,
  category_id,
  subcategory,
  description,
  long_description,
  unit,
  labor_cost * 5.5 as labor_cost,
  material_cost * 5.5 as material_cost,
  equipment_cost * 5.5 as equipment_cost,
  other_cost * 5.5 as other_cost,
  base_price * 5.5 as base_price,
  margin_percentage,
  final_price * 5.5 as final_price,
  is_active,
  is_custom,
  is_imported,
  user_id,
  notes,
  color,
  brand,
  model,
  created_at,
  updated_at
FROM price_master
WHERE is_active = true AND is_custom = false;

-- Habilitar RLS
ALTER TABLE price_master_brazil ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "Anyone can view active prices"
  ON price_master_brazil
  FOR SELECT
  USING (is_active = true AND (user_id IS NULL OR user_id = auth.uid()));
```

### Paso 5: Actualizar Mapping en `price-service.ts`

```typescript
function getPriceTableByCountry(countryCode: string): string {
  const countryTables: Record<string, string> = {
    ES: "price_master",
    PE: "price_master_peru",
    // ... existentes ...
    BR: "price_master_brazil", // <-- AÑADIR NUEVO PAÍS
  }
  return countryTables[countryCode] || "price_master"
}

function getUserPriceTableByCountry(countryCode: string): string {
  const countryTables: Record<string, string> = {
    ES: "user_prices",
    PE: "user_prices_peru",
    // ... existentes ...
    BR: "user_prices_brazil", // <-- AÑADIR NUEVO PAÍS
  }
  return countryTables[countryCode] || "user_prices"
}
```

## 💰 Conversiones de Moneda Actuales

| País | Código | Moneda | Símbolo | Conversión desde EUR |
|------|--------|--------|---------|---------------------|
| España | ES | EUR | € | 1.00 (base) |
| Estados Unidos | US | USD | $ | × 1.10 |
| México | MX | MXN | $ | × 19.00 |
| Colombia | CO | COP | $ | × 4,500.00 |
| Argentina | AR | ARS | $ | × 1,000.00 |
| Chile | CL | CLP | $ | × 1,000.00 |
| Perú | PE | PEN | S/ | × 4.00 |
| Reino Unido | GB | GBP | £ | × 0.85 |

**⚠️ Nota:** Estas conversiones son aproximadas y deben actualizarse regularmente según las tasas de cambio reales y los costos de construcción locales.

## 🔄 Actualizar Precios Existentes

### Actualizar todos los precios de un país (Tabla Centralizada)

```sql
-- Actualizar precios de México con nueva conversión
UPDATE price_master_by_country
SET 
  final_price = pm.final_price * 20.00,  -- Nueva tasa de conversión
  updated_at = NOW()
FROM price_master pm
WHERE price_master_by_country.price_master_id = pm.id
  AND price_master_by_country.country_code = 'MX';
```

### Actualizar categoría específica

```sql
-- Actualizar solo precios de albañilería para Colombia
UPDATE price_master_by_country pbc
SET 
  final_price = pm.final_price * 4800,  -- Nueva tasa
  updated_at = NOW()
FROM price_master pm
WHERE pbc.price_master_id = pm.id
  AND pbc.country_code = 'CO'
  AND pm.category_id = '01-ALBANILERIA';
```

### Añadir ajuste porcentual por país

```sql
-- Aumentar todos los precios de España en 5%
UPDATE price_master_by_country
SET 
  final_price = final_price * 1.05,
  updated_at = NOW()
WHERE country_code = 'ES';
```

## 🌐 Localización de Términos

Cada país puede tener términos diferentes para los mismos conceptos:

| Español (ES) | México (MX) | Colombia (CO) | Argentina (AR) | Chile (CL) |
|--------------|-------------|---------------|----------------|------------|
| Tabique | Muro divisorio | Drywall | Durlock | Volcanita |
| Alicatado | Azulejo | Enchape | Revestimiento cerámico | Revestimiento cerámico |
| Rodapié | Zoclo | Guarda escoba | Zócalo | Guardapolvo |
| Tarima | Piso de madera | Piso de madera | Piso de madera | Piso de madera |

Estos términos se actualizan en los campos `localized_name` y `localized_description` de la tabla `price_master_by_country`.

## 🚀 Ejecutar Scripts de Migración

### Desde la aplicación (Recomendado)

1. Crear el script SQL en `/scripts/`
2. Crear endpoint API en `/app/api/migrate-[nombre]/route.ts`
3. Llamar al endpoint desde el dashboard de administración

### Desde Supabase Dashboard

1. Ir a SQL Editor en Supabase
2. Copiar y pegar el script SQL
3. Ejecutar

### Verificar Resultados

```sql
-- Ver resumen de precios por país
SELECT 
  country_code,
  currency_code,
  COUNT(*) as total_prices,
  MIN(final_price) as min_price,
  MAX(final_price) as max_price,
  ROUND(AVG(final_price), 2) as avg_price
FROM price_master_by_country
WHERE is_active = true
GROUP BY country_code, currency_code
ORDER BY country_code;
```

## 📝 Checklist para Nuevo País

- [ ] Añadir moneda en `currency-service.ts` (si no existe)
- [ ] Añadir país en `currency-service.ts`
- [ ] Añadir etiquetas de campos en `country-fields.ts`
- [ ] Crear script SQL para insertar precios
- [ ] Ejecutar script SQL
- [ ] Actualizar mapping en `price-service.ts` (solo si usas tablas separadas)
- [ ] Verificar precios insertados correctamente
- [ ] Probar creación de proyecto en el nuevo país
- [ ] Verificar generación de presupuesto con precios correctos

## 🆘 Troubleshooting

### Los precios no aparecen para un país

1. Verificar que el país esté en `COUNTRIES` en `currency-service.ts`
2. Verificar que existan precios en la BBDD para ese país:
```sql
SELECT COUNT(*) 
FROM price_master_by_country 
WHERE country_code = 'XX' AND is_active = true;
```

### Los precios son 0 o incorrectos

1. Verificar la tasa de conversión usada en el script SQL
2. Verificar que `final_price` no sea NULL
3. Recalcular precios si es necesario

### El usuario no ve sus precios personalizados

1. Verificar que la tabla `user_prices_[pais]` exista (si usas tablas separadas)
2. Verificar que el mapping en `price-service.ts` sea correcto
3. Verificar las políticas RLS en Supabase

---

**Última actualización:** Enero 2025
**Mantenido por:** Equipo Presupuestalo
