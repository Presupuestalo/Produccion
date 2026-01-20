-- Añadir columna para rastrear proyectos importados desde leads
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS created_from_lead UUID REFERENCES lead_requests(id) ON DELETE SET NULL;

-- Añadir índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_projects_created_from_lead ON projects(created_from_lead);

-- Comentario para documentación
COMMENT ON COLUMN projects.created_from_lead IS 'ID del lead_request del que fue importado este proyecto (si aplica)';
