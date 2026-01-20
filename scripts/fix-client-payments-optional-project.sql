-- Modificar la tabla client_payments para hacer project_id opcional
-- Esto permite registrar ingresos generales no vinculados a proyectos específicos

ALTER TABLE client_payments 
  ALTER COLUMN project_id DROP NOT NULL;

-- Actualizar el índice para manejar valores NULL
DROP INDEX IF EXISTS idx_client_payments_project_id;
CREATE INDEX idx_client_payments_project_id ON client_payments(project_id) WHERE project_id IS NOT NULL;

-- Añadir un comentario explicativo
COMMENT ON COLUMN client_payments.project_id IS 'ID del proyecto asociado (opcional). NULL para ingresos generales.';
