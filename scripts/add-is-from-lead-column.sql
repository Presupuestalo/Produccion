-- Añadir columna is_from_lead a projects para excluir del límite
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_from_lead BOOLEAN DEFAULT FALSE;

-- Verificar que la columna existe
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'projects' AND column_name = 'is_from_lead';
