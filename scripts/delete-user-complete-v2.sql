-- Función mejorada para eliminar un usuario y todos sus datos relacionados
-- Incluye manejo correcto de todas las tablas y devuelve URLs de imágenes para eliminar del blob storage

CREATE OR REPLACE FUNCTION delete_user_and_related_data(user_uuid UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  projects_count INT;
  calculator_data_count INT;
  clients_count INT;
  appointments_count INT;
  floor_plans_count INT;
  floor_plans_3d_count INT;
  room_photos_count INT;
  generated_designs_count INT;
  budget_comparisons_count INT;
  quote_requests_count INT;
  quote_offers_count INT;
  portfolio_count INT;
  user_prices_count INT;
  image_urls TEXT[];
BEGIN
  -- Verificar que el usuario existe en profiles
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = user_uuid) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuario no encontrado',
      'message', 'El usuario no existe en la base de datos'
    );
  END IF;

  -- Recopilar URLs de imágenes antes de eliminar
  SELECT array_agg(DISTINCT url) INTO image_urls
  FROM (
    -- Imágenes de room_photos
    SELECT photo_url as url 
    FROM room_photos 
    WHERE project_id IN (SELECT id FROM projects WHERE user_id = user_uuid)
    
    UNION
    
    -- Imágenes de project_floor_plans
    SELECT image_url as url 
    FROM project_floor_plans 
    WHERE project_id IN (SELECT id FROM projects WHERE user_id = user_uuid)
    
    UNION
    
    -- Imágenes de floor_plans
    SELECT image_data as url 
    FROM floor_plans 
    WHERE user_id = user_uuid
    
    UNION
    
    -- Imágenes de floor_plans_3d
    SELECT model_url as url 
    FROM floor_plans_3d 
    WHERE user_id = user_uuid
    
    UNION
    
    -- Imágenes de generated_designs
    SELECT original_image_url as url 
    FROM generated_designs 
    WHERE user_id = user_uuid
    
    UNION
    
    -- Imágenes de professional_portfolio
    SELECT image_url as url 
    FROM professional_portfolio 
    WHERE professional_id = user_uuid
  ) urls
  WHERE url IS NOT NULL;

  -- Contar registros antes de eliminar
  SELECT COUNT(*) INTO projects_count FROM projects WHERE user_id = user_uuid;
  SELECT COUNT(*) INTO calculator_data_count FROM calculator_data WHERE project_id IN (SELECT id FROM projects WHERE user_id = user_uuid);
  SELECT COUNT(*) INTO clients_count FROM clients WHERE user_id = user_uuid;
  SELECT COUNT(*) INTO appointments_count FROM project_appointments WHERE user_id = user_uuid;
  SELECT COUNT(*) INTO floor_plans_count FROM floor_plans WHERE user_id = user_uuid;
  SELECT COUNT(*) INTO floor_plans_3d_count FROM floor_plans_3d WHERE user_id = user_uuid;
  SELECT COUNT(*) INTO room_photos_count FROM room_photos WHERE project_id IN (SELECT id FROM projects WHERE user_id = user_uuid);
  SELECT COUNT(*) INTO generated_designs_count FROM generated_designs WHERE user_id = user_uuid;
  SELECT COUNT(*) INTO budget_comparisons_count FROM budget_comparisons WHERE user_id = user_uuid;
  SELECT COUNT(*) INTO quote_requests_count FROM quote_requests WHERE homeowner_id = user_uuid OR professional_id = user_uuid;
  SELECT COUNT(*) INTO quote_offers_count FROM quote_offers WHERE professional_id = user_uuid;
  SELECT COUNT(*) INTO portfolio_count FROM professional_portfolio WHERE professional_id = user_uuid;
  SELECT COUNT(*) INTO user_prices_count FROM price_master WHERE user_id = user_uuid;

  -- Eliminar en orden correcto (hijos primero, padres después)
  
  -- 1. Eliminar datos relacionados con proyectos
  DELETE FROM room_photos WHERE project_id IN (SELECT id FROM projects WHERE user_id = user_uuid);
  DELETE FROM project_floor_plans WHERE project_id IN (SELECT id FROM projects WHERE user_id = user_uuid);
  DELETE FROM calculator_data WHERE project_id IN (SELECT id FROM projects WHERE user_id = user_uuid);
  DELETE FROM budgets WHERE project_id IN (SELECT id FROM projects WHERE user_id = user_uuid);
  DELETE FROM project_licenses WHERE project_id IN (SELECT id FROM projects WHERE user_id = user_uuid);
  DELETE FROM project_contracts WHERE project_id IN (SELECT id FROM projects WHERE user_id = user_uuid);
  DELETE FROM budget_settings WHERE project_id IN (SELECT id FROM projects WHERE user_id = user_uuid);
  
  -- 2. Eliminar proyectos
  DELETE FROM projects WHERE user_id = user_uuid;
  
  -- 3. Eliminar clientes y citas
  DELETE FROM project_appointments WHERE user_id = user_uuid;
  DELETE FROM clients WHERE user_id = user_uuid;
  
  -- 4. Eliminar planos y diseños
  DELETE FROM floor_plans_3d WHERE user_id = user_uuid;
  DELETE FROM floor_plans WHERE user_id = user_uuid;
  DELETE FROM generated_designs WHERE user_id = user_uuid;
  
  -- 5. Eliminar presupuestos y comparaciones
  DELETE FROM budget_comparisons WHERE user_id = user_uuid;
  
  -- 6. Eliminar solicitudes y ofertas de presupuesto
  DELETE FROM quote_offers WHERE professional_id = user_uuid;
  DELETE FROM quote_requests WHERE homeowner_id = user_uuid OR professional_id = user_uuid;
  
  -- 7. Eliminar portafolio profesional
  DELETE FROM professional_portfolio WHERE professional_id = user_uuid;
  DELETE FROM professional_subscriptions WHERE professional_id = user_uuid;
  
  -- 8. Eliminar precios personalizados
  DELETE FROM price_master WHERE user_id = user_uuid;
  DELETE FROM price_history WHERE changed_by = user_uuid;
  
  -- 9. Eliminar configuraciones de usuario
  DELETE FROM user_company_settings WHERE user_id = user_uuid;
  
  -- 10. Eliminar el perfil del usuario
  DELETE FROM profiles WHERE id = user_uuid;
  
  -- 11. Eliminar el usuario de auth (si existe)
  DELETE FROM auth.users WHERE id = user_uuid;

  -- Construir respuesta con resumen y URLs de imágenes
  result := json_build_object(
    'success', true,
    'message', 'Usuario eliminado correctamente',
    'deleted_counts', json_build_object(
      'projects', projects_count,
      'calculator_data', calculator_data_count,
      'clients', clients_count,
      'appointments', appointments_count,
      'floor_plans', floor_plans_count,
      'floor_plans_3d', floor_plans_3d_count,
      'room_photos', room_photos_count,
      'generated_designs', generated_designs_count,
      'budget_comparisons', budget_comparisons_count,
      'quote_requests', quote_requests_count,
      'quote_offers', quote_offers_count,
      'portfolio', portfolio_count,
      'user_prices', user_prices_count
    ),
    'image_urls_to_delete', COALESCE(image_urls, ARRAY[]::TEXT[]),
    'total_images', COALESCE(array_length(image_urls, 1), 0)
  );

  RETURN result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Error al eliminar el usuario: ' || SQLERRM
    );
END;
$$;

-- Dar permisos de ejecución
GRANT EXECUTE ON FUNCTION delete_user_and_related_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user_and_related_data(UUID) TO service_role;
