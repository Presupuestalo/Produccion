-- Script completo para arreglar las políticas RLS de lead_interactions y lead_requests
-- Ejecutar este script para permitir que los profesionales vean sus leads adquiridos

-- 1. Asegurar que RLS está habilitado en ambas tablas
ALTER TABLE lead_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_requests ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas existentes de lead_interactions
DROP POLICY IF EXISTS "Empresas ven sus interacciones" ON lead_interactions;
DROP POLICY IF EXISTS "Empresas ven interacciones con lead" ON lead_interactions;
DROP POLICY IF EXISTS "Sistema puede crear interacciones" ON lead_interactions;
DROP POLICY IF EXISTS "Profesionales ven sus interacciones" ON lead_interactions;

-- 3. Crear política para que empresas/profesionales vean sus propias interacciones
CREATE POLICY "Profesionales ven sus interacciones" ON lead_interactions
  FOR SELECT USING (company_id = auth.uid());

-- 4. Crear política para que el sistema pueda insertar interacciones (desde el servidor)
CREATE POLICY "Sistema inserta interacciones" ON lead_interactions
  FOR INSERT WITH CHECK (true);

-- 5. Eliminar políticas existentes de lead_requests que puedan interferir
DROP POLICY IF EXISTS "Empresas ven leads disponibles" ON lead_requests;
DROP POLICY IF EXISTS "Empresas ven leads que accedieron" ON lead_requests;
DROP POLICY IF EXISTS "Propietarios ven sus leads" ON lead_requests;

-- 6. Crear política para que empresas vean leads disponibles (open y con cupo)
CREATE POLICY "Empresas ven leads disponibles" ON lead_requests
  FOR SELECT USING (
    status = 'open' AND companies_accessed_count < max_companies
  );

-- 7. Crear política para que empresas vean los leads que han accedido (para JOIN)
CREATE POLICY "Empresas ven leads accedidos" ON lead_requests
  FOR SELECT USING (
    auth.uid() = ANY(companies_accessed_ids)
  );

-- 8. Crear política para que propietarios vean sus propios leads
CREATE POLICY "Propietarios ven sus leads" ON lead_requests
  FOR SELECT USING (
    homeowner_id = auth.uid()
  );

-- 9. Verificar que existen los índices necesarios
CREATE INDEX IF NOT EXISTS idx_lead_interactions_company ON lead_interactions(company_id);
CREATE INDEX IF NOT EXISTS idx_lead_interactions_action ON lead_interactions(action);
CREATE INDEX IF NOT EXISTS idx_lead_requests_accessed_ids ON lead_requests USING GIN(companies_accessed_ids);

-- 10. Mostrar las políticas creadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('lead_interactions', 'lead_requests');
