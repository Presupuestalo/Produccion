-- Reseteo y aplicación correcta de políticas RLS para lead_requests

-- 1. Asegurar que RLS está habilitado
ALTER TABLE lead_requests ENABLE ROW LEVEL SECURITY;

-- 2. Limpiar políticas existentes para evitar conflictos
DROP POLICY IF EXISTS "Propietarios ven sus solicitudes" ON lead_requests;
DROP POLICY IF EXISTS "Propietarios crean solicitudes" ON lead_requests;
DROP POLICY IF EXISTS "Empresas ven leads disponibles" ON lead_requests;
DROP POLICY IF EXISTS "Everyone can select lead_requests" ON lead_requests;
DROP POLICY IF EXISTS "Homeowners can see their own lead requests" ON lead_requests;
DROP POLICY IF EXISTS "Professionals can see open lead requests" ON lead_requests;

-- 3. Política para PROPIETARIOS: Pueden ver sus propias solicitudes
CREATE POLICY "Homeowners can see their own lead requests"
ON lead_requests
FOR SELECT
TO authenticated
USING (homeowner_id = auth.uid());

-- 4. Política para PROFESIONALES: Pueden ver solicitudes abiertas que no han alcanzado el máximo
-- Nota: Solo pueden verlas si NO son los propietarios (ya filtrado en la API pero bueno por seguridad)
CREATE POLICY "Professionals can see open lead requests"
ON lead_requests
FOR SELECT
TO authenticated
USING (
  status = 'open' 
  AND (companies_accessed_count < max_companies)
  AND homeowner_id != auth.uid()
);

-- 5. Política para INSERTAR: Los propietarios pueden crear solicitudes
-- (Ya suele estar configurado, pero lo aseguramos)
DROP POLICY IF EXISTS "Homeowners can insert their lead requests" ON lead_requests;
CREATE POLICY "Homeowners can insert their lead requests"
ON lead_requests
FOR INSERT
TO authenticated
WITH CHECK (homeowner_id = auth.uid());

-- 6. Política para ADMINS (Service Role) - No suele ser necesaria con service_role pero por si acaso
-- CREATE POLICY "Admins can do everything" ON lead_requests FOR ALL USING (true);

-- Log de éxito
DO $$ 
BEGIN 
  RAISE NOTICE 'Políticas RLS de lead_requests actualizadas correctamente';
END $$;
