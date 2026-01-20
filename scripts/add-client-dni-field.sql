-- Add DNI field to projects table for client identification
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS client_dni TEXT;

COMMENT ON COLUMN projects.client_dni IS 'DNI/NIF del cliente para el contrato';
