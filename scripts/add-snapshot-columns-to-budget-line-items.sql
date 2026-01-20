-- Script para añadir las columnas necesarias para el sistema de snapshot de precios
-- Este script permite que budget_line_items tenga una copia completa de los datos
-- en el momento de creación, sin depender de price_master

-- Añadir columna para almacenar el código del precio (ej: "01-D-01")
ALTER TABLE budget_line_items
ADD COLUMN IF NOT EXISTS code TEXT;

-- Añadir columna para referenciar el precio original de price_master (opcional)
ALTER TABLE budget_line_items
ADD COLUMN IF NOT EXISTS base_price_id UUID;

-- Añadir columna para indicar el origen del precio: 'master', 'custom', 'imported'
ALTER TABLE budget_line_items
ADD COLUMN IF NOT EXISTS price_type TEXT DEFAULT 'master'
CHECK (price_type IN ('master', 'custom', 'imported'));

-- Crear índice para base_price_id para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_budget_line_items_base_price_id 
ON budget_line_items(base_price_id);

-- Añadir foreign key a price_master (opcional, permite null)
ALTER TABLE budget_line_items
ADD CONSTRAINT fk_budget_line_items_price_master
FOREIGN KEY (base_price_id) 
REFERENCES price_master(id)
ON DELETE SET NULL;

-- Comentarios para documentar
COMMENT ON COLUMN budget_line_items.code IS 'Código del precio (ej: 01-D-01) copiado de price_master en el momento de creación';
COMMENT ON COLUMN budget_line_items.base_price_id IS 'Referencia al precio original en price_master (null si es custom o importado)';
COMMENT ON COLUMN budget_line_items.price_type IS 'Origen del precio: master (de catálogo), custom (personalizado por usuario), imported (importado de archivo)';
