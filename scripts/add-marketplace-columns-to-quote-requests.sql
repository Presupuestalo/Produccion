-- Añadir columnas necesarias para el marketplace a quote_requests
-- Script: add-marketplace-columns-to-quote-requests.sql

-- Columna para contar empresas que han accedido
ALTER TABLE quote_requests 
ADD COLUMN IF NOT EXISTS companies_accessed_count INTEGER DEFAULT 0;

-- Columna para máximo de empresas
ALTER TABLE quote_requests 
ADD COLUMN IF NOT EXISTS max_companies INTEGER DEFAULT 4;

-- Columna para provincia (separada de city)
ALTER TABLE quote_requests 
ADD COLUMN IF NOT EXISTS province TEXT;

-- Columna para snapshot del presupuesto (JSON con detalles)
ALTER TABLE quote_requests 
ADD COLUMN IF NOT EXISTS budget_snapshot JSONB;

-- Columna para el coste en créditos calculado
ALTER TABLE quote_requests 
ADD COLUMN IF NOT EXISTS credits_cost INTEGER;

-- Actualizar solicitudes existentes: extraer provincia de city si contiene coma
UPDATE quote_requests 
SET province = TRIM(SPLIT_PART(city, ',', 2))
WHERE province IS NULL AND city LIKE '%,%';

-- Crear índice para mejorar consultas del marketplace
CREATE INDEX IF NOT EXISTS idx_quote_requests_marketplace 
ON quote_requests(status, companies_accessed_count, max_companies);

-- Mostrar estructura actualizada
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'quote_requests'
ORDER BY ordinal_position;
