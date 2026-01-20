-- Añadir columna para el % de margen que ya viene incluido en presupuestos de gremios
ALTER TABLE coordinator_project_trades 
ADD COLUMN IF NOT EXISTS margin_percentage_included DECIMAL(5,2) DEFAULT 0;

-- Comentario para documentación
COMMENT ON COLUMN coordinator_project_trades.margin_percentage_included IS 
'Porcentaje de margen que el gremio ya ha incluido en su presupuesto para el coordinador';
