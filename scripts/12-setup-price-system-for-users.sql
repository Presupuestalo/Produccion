-- Script para configurar el sistema de precios para usuarios profesionales
-- Los usuarios verán precios base y podrán crear copias personalizadas

-- 1. Actualizar políticas RLS para permitir ver precios base
DROP POLICY IF EXISTS "Todos pueden ver precios base" ON price_master;
DROP POLICY IF EXISTS "Usuarios pueden ver sus precios" ON price_master;
DROP POLICY IF EXISTS "Usuarios pueden crear precios" ON price_master;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus precios" ON price_master;
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus precios" ON price_master;

-- Política para ver precios base (is_custom = false, user_id = NULL)
CREATE POLICY "Ver precios base"
  ON price_master FOR SELECT
  USING (is_custom = false AND user_id IS NULL);

-- Política para ver precios propios del usuario
CREATE POLICY "Ver precios propios"
  ON price_master FOR SELECT
  USING (user_id = auth.uid());

-- Política para crear precios personalizados
CREATE POLICY "Crear precios personalizados"
  ON price_master FOR INSERT
  WITH CHECK (user_id = auth.uid() AND is_custom = true);

-- Política para actualizar solo precios propios
CREATE POLICY "Actualizar precios propios"
  ON price_master FOR UPDATE
  USING (user_id = auth.uid() AND is_custom = true);

-- Política para eliminar solo precios propios
CREATE POLICY "Eliminar precios propios"
  ON price_master FOR DELETE
  USING (user_id = auth.uid() AND is_custom = true);

-- 2. Crear función para copiar precios base a un usuario
CREATE OR REPLACE FUNCTION copy_master_prices_to_user(target_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  copied_count INTEGER := 0;
BEGIN
  -- Copiar todos los precios base (is_custom = false, user_id IS NULL)
  -- como precios personalizados para el usuario
  INSERT INTO price_master (
    id,
    code,
    category_id,
    subcategory,
    description,
    long_description,
    unit,
    labor_cost,
    material_cost,
    equipment_cost,
    other_cost,
    base_price,
    margin_percentage,
    final_price,
    is_active,
    is_custom,
    user_id,
    notes,
    color,
    brand,
    model
  )
  SELECT
    gen_random_uuid()::text,  -- Nuevo ID único
    code || '-USER-' || target_user_id::text,  -- Código único para el usuario
    category_id,
    subcategory,
    description,
    long_description,
    unit,
    labor_cost,
    material_cost,
    equipment_cost,
    other_cost,
    base_price,
    margin_percentage,
    final_price,
    is_active,
    true,  -- is_custom = true para precios de usuario
    target_user_id,  -- Asignar al usuario
    notes,
    color,
    brand,
    model
  FROM price_master
  WHERE is_custom = false 
    AND user_id IS NULL
    AND NOT EXISTS (
      -- Evitar duplicados
      SELECT 1 FROM price_master pm2
      WHERE pm2.user_id = target_user_id
        AND pm2.code = price_master.code || '-USER-' || target_user_id::text
    );

  GET DIAGNOSTICS copied_count = ROW_COUNT;
  RETURN copied_count;
END;
$$;

-- 3. Crear trigger para copiar precios automáticamente cuando se crea un usuario profesional
CREATE OR REPLACE FUNCTION trigger_copy_prices_on_profile_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Solo copiar si el usuario es profesional
  IF NEW.user_type = 'professional' THEN
    PERFORM copy_master_prices_to_user(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

-- Eliminar trigger existente si existe
DROP TRIGGER IF EXISTS copy_prices_on_profile_creation ON profiles;

-- Crear trigger que se ejecuta después de insertar un perfil
CREATE TRIGGER copy_prices_on_profile_creation
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_copy_prices_on_profile_creation();

-- 4. Comentarios para documentación
COMMENT ON FUNCTION copy_master_prices_to_user IS 'Copia todos los precios maestros base a un usuario específico como precios personalizados';
COMMENT ON FUNCTION trigger_copy_prices_on_profile_creation IS 'Trigger que copia automáticamente los precios base cuando se crea un usuario profesional';
