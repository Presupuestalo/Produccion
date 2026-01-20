# Instrucciones para Normalizar Precios Maestros

## 🎯 Objetivo

Normalizar y actualizar todos los precios maestros para los 21 países soportados en la aplicación, aplicando tasas de conversión actualizadas y asegurando consistencia en todas las tablas.

## 📋 Pasos para Ejecutar la Normalización

### Opción 1: Desde la Aplicación (Recomendado)

1. **Ir al dashboard de administración**
   - URL: `https://presupuestalo.com/dashboard/admin`
   - (Crear página si no existe)

2. **Ejecutar normalización automática**
   ```bash
   POST /api/normalize-prices
   ```
   
   Esto ejecutará automáticamente los 3 scripts SQL en orden:
   - Script 1: Actualizar tasas de conversión
   - Script 2: Crear todas las tablas necesarias
   - Script 3: Poblar con precios convertidos

3. **Verificar resultados**
   ```bash
   GET /api/normalize-prices
   ```
   
   Mostrará estadísticas de precios por país

### Opción 2: Desde Supabase SQL Editor

1. **Abrir Supabase Dashboard**
   - Ir a: SQL Editor

2. **Ejecutar scripts en orden**:
   
   **Script 1:** `scripts/normalize-all-country-prices-v1.sql`
   - Actualiza campos de price_master
   - Define tasas de conversión actualizadas
   
   **Script 2:** `scripts/normalize-all-country-prices-v2-create-tables.sql`
   - Crea todas las tablas de precios por país
   - Configura políticas RLS
   
   **Script 3:** `scripts/normalize-all-country-prices-v3-populate.sql`
   - Copia y convierte todos los precios
   - Aplica las tasas de conversión

3. **Verificar resultados**
   ```sql
   -- Ver resumen por país
   SELECT 
     'ES' as country, COUNT(*) as total 
   FROM price_master 
   WHERE is_active = true
   
   UNION ALL
   
   SELECT 
     'PE' as country, COUNT(*) as total 
   FROM price_master_peru 
   WHERE is_active = true
   
   -- Repetir para cada país...
   ```

## 🌍 Países Incluidos

| Código | País | Moneda | Tasa desde EUR |
|--------|------|--------|----------------|
| ES | España | EUR € | 1.00 (base) |
| US | Estados Unidos | USD $ | 1.10 |
| GB | Reino Unido | GBP £ | 0.85 |
| MX | México | MXN $ | 20.00 |
| CO | Colombia | COP $ | 4,500.00 |
| AR | Argentina | ARS $ | 1,000.00 |
| PE | Perú | PEN S/ | 4.10 |
| CL | Chile | CLP $ | 1,000.00 |
| BO | Bolivia | BOB Bs. | 7.50 |
| VE | Venezuela | VES Bs. | 40.00 |
| EC | Ecuador | USD $ | 1.10 |
| GT | Guatemala | GTQ Q | 8.50 |
| CU | Cuba | CUP $ | 26.00 |
| DO | Rep. Dominicana | DOP RD$ | 63.00 |
| HN | Honduras | HNL L | 27.00 |
| PY | Paraguay | PYG ₲ | 8,000.00 |
| NI | Nicaragua | NIO C$ | 40.00 |
| SV | El Salvador | USD $ | 1.10 |
| CR | Costa Rica | CRC ₡ | 570.00 |
| PA | Panamá | PAB B/. | 1.10 |
| UY | Uruguay | UYU $U | 43.00 |
| GQ | Guinea Ecuatorial | XAF FCFA | 650.00 |

## ⚠️ Advertencias Importantes

1. **Las tasas de conversión son aproximadas**
   - Basadas en promedios de mercado
   - Deben actualizarse periódicamente
   - Los costos de construcción varían significativamente por región

2. **Ajustes manuales necesarios**
   - Cada país tiene costos de mano de obra diferentes
   - Los materiales pueden ser más/menos caros según disponibilidad
   - Se recomienda validar precios con profesionales locales

3. **Países con alta volatilidad**
   - 🔴 **Venezuela**: Alta inflación, revisar mensualmente
   - 🔴 **Argentina**: Alta inflación, revisar cada 2-3 meses
   - 🟡 **Otros**: Revisar trimestralmente

## 📊 Después de la Normalización

### Verificar Consistencia

```sql
-- Verificar que todos los países tengan precios
SELECT 
  'price_master' as tabla,
  COUNT(*) as total,
  MIN(final_price) as min_precio,
  MAX(final_price) as max_precio,
  ROUND(AVG(final_price), 2) as avg_precio
FROM price_master
WHERE is_active = true

UNION ALL

SELECT 
  'price_master_peru' as tabla,
  COUNT(*) as total,
  MIN(final_price) as min_precio,
  MAX(final_price) as max_precio,
  ROUND(AVG(final_price), 2) as avg_precio
FROM price_master_peru
WHERE is_active = true;

-- Repetir para cada país...
```

### Próximos Pasos

1. **Localizar términos**
   - Adaptar nombres de partidas a cada país
   - Ejemplo: "Tabique" (ES) → "Drywall" (MX)

2. **Ajustar precios por región**
   - Dentro de cada país pueden haber diferencias regionales
   - Considerar crear tablas adicionales si es necesario

3. **Implementar sistema de actualización automática**
   - APIs de tasas de cambio
   - Índices de construcción por país
   - Alertas de inflación

## 🔧 Mantenimiento

### Actualizar Tasas de Conversión

```sql
-- Actualizar tasa para un país específico
UPDATE temp_conversion_rates 
SET rate_from_eur = 4.2 
WHERE country_code = 'PE';

-- Luego reejecutar script de población
```

### Añadir Nuevo País

1. Añadir a `conversion_rates` en script v1
2. Añadir a arrays en script v2
3. Reejecutar scripts 2 y 3

---

**Última actualización:** Enero 2025
