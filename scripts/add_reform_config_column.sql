-- Añadir columna reform_config para guardar la configuración de reforma
ALTER TABLE calculator_data 
ADD COLUMN IF NOT EXISTS reform_config JSONB;

-- Añadir comentario a la columna
COMMENT ON COLUMN calculator_data.reform_config IS 'Configuración de la sección de reforma (calefacción, suelos, pintura, techos, puerta entrada)';
