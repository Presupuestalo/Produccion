-- Add DNI field to projects table for client identification
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS client_dni VARCHAR(20);

-- Add comment to document the field
COMMENT ON COLUMN projects.client_dni IS 'DNI/NIF del cliente';
