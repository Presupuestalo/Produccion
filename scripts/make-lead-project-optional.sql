-- Hacer project_id opcional en lead_requests para permitir ofertas desde landing
-- sin necesidad de crear un proyecto completo

-- 1. Eliminar la restricción NOT NULL de project_id
ALTER TABLE lead_requests 
ALTER COLUMN project_id DROP NOT NULL;

-- 2. Eliminar la restricción de foreign key actual y recrearla para permitir NULL
ALTER TABLE lead_requests 
DROP CONSTRAINT IF EXISTS lead_requests_project_id_fkey;

ALTER TABLE lead_requests
ADD CONSTRAINT lead_requests_project_id_fkey 
FOREIGN KEY (project_id) 
REFERENCES projects(id) 
ON DELETE SET NULL;

-- 3. También hacer postal_code opcional (no siempre lo tenemos desde la landing)
ALTER TABLE lead_requests 
ALTER COLUMN postal_code DROP NOT NULL;

-- Log de éxito
DO $$ 
BEGIN 
  RAISE NOTICE 'project_id y postal_code ahora son opcionales en lead_requests';
END $$;
