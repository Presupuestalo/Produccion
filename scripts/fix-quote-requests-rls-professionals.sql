-- Script para permitir que los profesionales vean las solicitudes de presupuesto pendientes
-- Esto es necesario para el flujo de ofertas donde los profesionales acceden a las solicitudes

-- Primero, verificar las políticas actuales
DO $$
BEGIN
  RAISE NOTICE 'Actualizando políticas RLS para quote_requests...';
END $$;

-- Eliminar política restrictiva si existe
DROP POLICY IF EXISTS "Users can view own quote requests" ON quote_requests;
DROP POLICY IF EXISTS "Professionals can view pending requests" ON quote_requests;
DROP POLICY IF EXISTS "Anyone authenticated can view pending requests" ON quote_requests;

-- Crear política que permite a usuarios autenticados ver solicitudes pendientes
CREATE POLICY "Anyone authenticated can view pending requests"
ON quote_requests
FOR SELECT
TO authenticated
USING (
  -- Ver tus propias solicitudes siempre
  auth.uid() = user_id
  OR
  -- O ver solicitudes pendientes (para profesionales que buscan trabajo)
  status IN ('pending', 'quoted')
);

-- También necesitamos permitir que los profesionales creen ofertas
DROP POLICY IF EXISTS "Professionals can insert offers" ON quote_offers;

-- Verificar si la tabla quote_offers existe y crear política
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'quote_offers') THEN
    -- Crear política para que profesionales puedan insertar ofertas
    EXECUTE 'CREATE POLICY "Professionals can insert offers" ON quote_offers FOR INSERT TO authenticated WITH CHECK (auth.uid() = professional_id)';
  END IF;
END $$;

-- Verificar resultado
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'quote_requests';
