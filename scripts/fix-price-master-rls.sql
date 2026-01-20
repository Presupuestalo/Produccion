-- Corregir políticas RLS de price_master para evitar error de permisos

-- 1. Eliminar políticas existentes que causan problemas
DROP POLICY IF EXISTS "Actualizar precios propios" ON public.price_master;
DROP POLICY IF EXISTS "Ver precios estándar y propios" ON public.price_master;
DROP POLICY IF EXISTS "Crear precios personalizados" ON public.price_master;
DROP POLICY IF EXISTS "Eliminar precios propios" ON public.price_master;

-- 2. Crear nuevas políticas simplificadas

-- Permitir ver todos los precios a usuarios autenticados
CREATE POLICY "Ver todos los precios"
  ON public.price_master FOR SELECT
  TO authenticated
  USING (true);

-- Permitir actualizar precios estándar a usuarios profesionales
-- (verificamos el user_type desde la tabla profiles, no desde auth.users)
CREATE POLICY "Actualizar precios como profesional"
  ON public.price_master FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.user_type IN ('professional', 'company')
    )
  );

-- Permitir crear precios personalizados
CREATE POLICY "Crear precios personalizados"
  ON public.price_master FOR INSERT
  TO authenticated
  WITH CHECK (
    is_custom = true 
    AND user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.user_type IN ('professional', 'company')
    )
  );

-- Permitir eliminar solo precios personalizados propios
CREATE POLICY "Eliminar precios propios"
  ON public.price_master FOR DELETE
  TO authenticated
  USING (
    is_custom = true 
    AND user_id = auth.uid()
  );

-- 3. Verificar que la tabla profiles tiene los permisos correctos
GRANT SELECT ON public.profiles TO authenticated;
