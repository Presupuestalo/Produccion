-- Añadir la columna selected_company a la tabla lead_requests
ALTER TABLE lead_requests ADD COLUMN IF NOT EXISTS selected_company UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Asegurarse de que el tipo de datos es correcto UUID
-- Esto permite rastrear qué empresa ha sido seleccionada por el cliente para el proyecto
-- y es necesario para que las consultas de leads funcionen sin el error 400 Bad Request
