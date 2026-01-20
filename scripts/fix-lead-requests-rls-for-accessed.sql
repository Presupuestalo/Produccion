-- Añadir política para que empresas puedan ver los leads que han accedido
-- Esto permite que el JOIN desde lead_interactions funcione correctamente

-- Primero, crear una política que permita a empresas ver leads que han accedido
DROP POLICY IF EXISTS "Empresas ven leads que accedieron" ON lead_requests;
CREATE POLICY "Empresas ven leads que accedieron" ON lead_requests
  FOR SELECT USING (
    auth.uid() = ANY(companies_accessed_ids)
  );

-- También permitir que las empresas vean sus propias interacciones incluyendo el lead
DROP POLICY IF EXISTS "Empresas ven interacciones con lead" ON lead_interactions;
CREATE POLICY "Empresas ven interacciones con lead" ON lead_interactions
  FOR SELECT USING (company_id = auth.uid());

-- Permitir insertar interacciones
DROP POLICY IF EXISTS "Sistema puede crear interacciones" ON lead_interactions;
CREATE POLICY "Sistema puede crear interacciones" ON lead_interactions
  FOR INSERT WITH CHECK (true);
