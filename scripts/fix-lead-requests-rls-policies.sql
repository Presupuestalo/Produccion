-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Propietarios pueden ver sus solicitudes" ON lead_requests;
DROP POLICY IF EXISTS "Propietarios pueden insertar solicitudes" ON lead_requests;
DROP POLICY IF EXISTS "Propietarios pueden actualizar sus solicitudes" ON lead_requests;
DROP POLICY IF EXISTS "Profesionales pueden ver solicitudes activas" ON lead_requests;

-- Habilitar RLS en la tabla
ALTER TABLE lead_requests ENABLE ROW LEVEL SECURITY;

-- Política para que los propietarios vean sus propias solicitudes
CREATE POLICY "Propietarios pueden ver sus solicitudes"
ON lead_requests
FOR SELECT
TO authenticated
USING (homeowner_id = auth.uid());

-- Política para que los propietarios creen solicitudes
CREATE POLICY "Propietarios pueden insertar solicitudes"
ON lead_requests
FOR INSERT
TO authenticated
WITH CHECK (homeowner_id = auth.uid());

-- Política para que los propietarios actualicen sus solicitudes
CREATE POLICY "Propietarios pueden actualizar sus solicitudes"
ON lead_requests
FOR UPDATE
TO authenticated
USING (homeowner_id = auth.uid())
WITH CHECK (homeowner_id = auth.uid());

-- Política para que los profesionales vean solicitudes activas
CREATE POLICY "Profesionales pueden ver solicitudes activas"
ON lead_requests
FOR SELECT
TO authenticated
USING (
  status = 'open' 
  AND expires_at > NOW()
  AND companies_accessed_count < max_companies
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_type = 'professional'
  )
);
