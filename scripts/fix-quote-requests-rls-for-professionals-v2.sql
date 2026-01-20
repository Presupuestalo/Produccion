-- Permitir que profesionales vean solicitudes pendientes
-- Primero eliminar política existente si existe
DROP POLICY IF EXISTS "Professionals can view pending quote requests" ON quote_requests;

-- Crear política para que cualquier usuario autenticado pueda ver solicitudes pendientes
-- (Los propietarios publican para que los profesionales las vean)
CREATE POLICY "Professionals can view pending quote requests"
  ON quote_requests FOR SELECT
  USING (
    status IN ('pending', 'quoted')
    OR auth.uid() = user_id
  );

-- Verificar políticas actuales
SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'quote_requests';
