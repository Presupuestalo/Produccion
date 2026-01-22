
-- Reparar y simplificar políticas RLS para lead_requests
ALTER TABLE lead_requests ENABLE ROW LEVEL SECURITY;

-- 1. Eliminar políticas existentes para evitar conflictos
DROP POLICY IF EXISTS "Propietarios ven sus solicitudes" ON lead_requests;
DROP POLICY IF EXISTS "Propietarios crean solicitudes" ON lead_requests;
DROP POLICY IF EXISTS "Empresas ven leads disponibles" ON lead_requests;
DROP POLICY IF EXISTS "Everyone can select for debug" ON lead_requests;

-- 2. Política para propietarios (Ver sus propias solicitudes)
CREATE POLICY "Propietarios ven sus solicitudes" ON lead_requests
  FOR SELECT
  TO authenticated
  USING (homeowner_id = auth.uid());

-- 3. Política para empresas (Ver leads abiertos en el marketplace)
-- Permitimos que cualquier profesional vea leads abiertos que no han llegado al máximo
CREATE POLICY "Empresas ven leads disponibles" ON lead_requests
  FOR SELECT
  TO authenticated
  USING (
    status = 'open' 
    AND companies_accessed_count < max_companies
  );

-- 4. Política para que el propietario pueda insertar (aunque lo hagamos por Admin API, no está de más)
CREATE POLICY "Propietarios crean solicitudes" ON lead_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (homeowner_id = auth.uid());

-- 5. Política para que el propietario pueda actualizar sus solicitudes (cerrarlas, etc)
CREATE POLICY "Propietarios actualizan sus solicitudes" ON lead_requests
  FOR UPDATE
  TO authenticated
  USING (homeowner_id = auth.uid());

-- Notificar éxito
DO $$ 
BEGIN 
  RAISE NOTICE 'RLS para lead_requests actualizado correctamente';
END $$;
