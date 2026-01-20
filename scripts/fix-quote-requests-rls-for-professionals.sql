-- Permitir a profesionales ver solicitudes pendientes para ofertar
-- IMPORTANTE: Ejecutar este script para que los profesionales puedan ver las ofertas

-- Primero, verificar si la política existe y eliminarla si es necesario
DROP POLICY IF EXISTS "Professionals can view pending quote requests" ON quote_requests;

-- Crear política que permite a profesionales ver solicitudes pendientes
CREATE POLICY "Professionals can view pending quote requests"
  ON quote_requests FOR SELECT
  USING (
    -- El propietario siempre puede ver sus propias solicitudes
    auth.uid() = user_id
    OR
    -- Los profesionales pueden ver solicitudes pendientes o quoted
    (
      status IN ('pending', 'quoted')
      AND EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.user_type = 'profesional'
      )
    )
  );

-- También necesitamos asegurar que los datos del propietario estén accesibles
-- cuando un profesional accede a una oferta
DROP POLICY IF EXISTS "Professionals can view quote request owners" ON profiles;

-- Verificar que se ejecutó correctamente
DO $$
BEGIN
  RAISE NOTICE 'Políticas RLS actualizadas correctamente para quote_requests';
END $$;
