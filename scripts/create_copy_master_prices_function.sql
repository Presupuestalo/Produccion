-- Función para copiar precios maestros a un usuario nuevo
CREATE OR REPLACE FUNCTION copy_master_prices_to_user(target_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  copied_count INTEGER;
BEGIN
  -- Copiar todos los precios maestros (user_id IS NULL) al usuario
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
    gen_random_uuid(), -- Nuevo ID único
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
    false, -- is_custom = false (son copias de maestros, no personalizados)
    target_user_id, -- Asignar al usuario
    notes,
    color,
    brand,
    model
  FROM price_master
  WHERE user_id IS NULL; -- Solo copiar precios maestros
  
  GET DIAGNOSTICS copied_count = ROW_COUNT;
  
  RETURN copied_count;
END;
$$ LANGUAGE plpgsql;

-- Trigger para copiar precios automáticamente cuando se crea un perfil de usuario
CREATE OR REPLACE FUNCTION trigger_copy_prices_on_profile_creation()
RETURNS TRIGGER AS $$
BEGIN
  -- Copiar precios maestros al nuevo usuario
  PERFORM copy_master_prices_to_user(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger si no existe
DROP TRIGGER IF EXISTS on_profile_created_copy_prices ON profiles;
CREATE TRIGGER on_profile_created_copy_prices
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_copy_prices_on_profile_creation();

COMMENT ON FUNCTION copy_master_prices_to_user IS 'Copia todos los precios maestros a un usuario específico';
COMMENT ON FUNCTION trigger_copy_prices_on_profile_creation IS 'Trigger que copia precios maestros automáticamente al crear un perfil';
