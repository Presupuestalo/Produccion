-- Añadir columnas faltantes a la tabla projects para los nuevos campos del formulario
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS street TEXT,
ADD COLUMN IF NOT EXISTS project_floor INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS door TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS province TEXT,
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'España',
ADD COLUMN IF NOT EXISTS ceiling_height DECIMAL(3,2) DEFAULT 2.60,
ADD COLUMN IF NOT EXISTS structure_type TEXT,
ADD COLUMN IF NOT EXISTS has_elevator TEXT;

-- Comentarios para documentar los nuevos campos
COMMENT ON COLUMN projects.street IS 'Calle y número del proyecto';
COMMENT ON COLUMN projects.project_floor IS 'Planta del proyecto (0=bajo, números positivos=plantas superiores)';
COMMENT ON COLUMN projects.door IS 'Puerta/mano del proyecto';
COMMENT ON COLUMN projects.city IS 'Ciudad del proyecto';
COMMENT ON COLUMN projects.province IS 'Provincia del proyecto';
COMMENT ON COLUMN projects.country IS 'País del proyecto';
COMMENT ON COLUMN projects.ceiling_height IS 'Altura máxima al techo en metros';
COMMENT ON COLUMN projects.structure_type IS 'Tipo de estructura (Hormigón, Ladrillo, etc.)';
COMMENT ON COLUMN projects.has_elevator IS 'Si tiene ascensor (Sí/No)';
