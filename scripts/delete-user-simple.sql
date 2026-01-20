-- Función simplificada para eliminar un usuario y todos sus datos relacionados
-- Sin recopilar URLs de imágenes (se eliminan automáticamente con ON DELETE CASCADE donde está configurado)

CREATE OR REPLACE FUNCTION delete_user_and_related_data(target_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_counts JSON;
  projects_count INT;
  calculator_count INT;
  clients_count INT;
  appointments_count INT;
  room_photos_count INT;
  floor_plans_count INT;
  floor_plans_3d_count INT;
  generated_designs_count INT;
  budget_comparisons_count INT;
  quote_requests_count INT;
  quote_offers_count INT;
  user_prices_count INT;
  portfolio_count INT;
  portfolio_projects_count INT;
BEGIN
  -- Eliminar datos en orden correcto (de hijos a padres)
  
  -- 1. Eliminar fotos de habitaciones (referencia a projects)
  DELETE FROM room_photos 
  WHERE project_id IN (SELECT id FROM projects WHERE user_id = target_user_id);
  GET DIAGNOSTICS room_photos_count = ROW_COUNT;
  
  -- 2. Eliminar comparaciones de presupuestos
  DELETE FROM budget_comparisons WHERE user_id = target_user_id;
  GET DIAGNOSTICS budget_comparisons_count = ROW_COUNT;
  
  -- 3. Eliminar ofertas de presupuesto (como profesional)
  DELETE FROM quote_offers WHERE professional_id = target_user_id;
  GET DIAGNOSTICS quote_offers_count = ROW_COUNT;
  
  -- 4. Eliminar solicitudes de presupuesto (como homeowner)
  DELETE FROM quote_requests WHERE homeowner_id = target_user_id;
  GET DIAGNOSTICS quote_requests_count = ROW_COUNT;
  
  -- 5. Eliminar diseños generados
  DELETE FROM generated_designs WHERE user_id = target_user_id;
  GET DIAGNOSTICS generated_designs_count = ROW_COUNT;
  
  -- 6. Eliminar planos 3D
  DELETE FROM floor_plans_3d WHERE user_id = target_user_id;
  GET DIAGNOSTICS floor_plans_3d_count = ROW_COUNT;
  
  -- 7. Eliminar planos 2D
  DELETE FROM floor_plans WHERE user_id = target_user_id;
  GET DIAGNOSTICS floor_plans_count = ROW_COUNT;
  
  -- 8. Eliminar proyectos del portafolio
  DELETE FROM professional_portfolio_projects WHERE portfolio_id IN (
    SELECT id FROM professional_portfolio WHERE professional_id = target_user_id
  );
  GET DIAGNOSTICS portfolio_projects_count = ROW_COUNT;
  
  -- 9. Eliminar portafolio profesional
  DELETE FROM professional_portfolio WHERE professional_id = target_user_id;
  GET DIAGNOSTICS portfolio_count = ROW_COUNT;
  
  -- 10. Eliminar precios personalizados del usuario
  DELETE FROM user_prices WHERE user_id = target_user_id;
  GET DIAGNOSTICS user_prices_count = ROW_COUNT;
  
  -- 11. Eliminar datos de calculadora (referencia a projects)
  DELETE FROM calculator_data WHERE project_id IN (SELECT id FROM projects WHERE user_id = target_user_id);
  GET DIAGNOSTICS calculator_count = ROW_COUNT;
  
  -- 12. Eliminar citas
  DELETE FROM project_appointments WHERE user_id = target_user_id;
  GET DIAGNOSTICS appointments_count = ROW_COUNT;
  
  -- 13. Eliminar clientes
  DELETE FROM clients WHERE user_id = target_user_id;
  GET DIAGNOSTICS clients_count = ROW_COUNT;
  
  -- 14. Eliminar proyectos
  DELETE FROM projects WHERE user_id = target_user_id;
  GET DIAGNOSTICS projects_count = ROW_COUNT;
  
  -- 15. Eliminar perfil del usuario (esto también eliminará el usuario de auth.users por CASCADE)
  DELETE FROM profiles WHERE id = target_user_id;
  
  -- Construir JSON con los conteos
  deleted_counts := json_build_object(
    'room_photos', room_photos_count,
    'budget_comparisons', budget_comparisons_count,
    'quote_offers', quote_offers_count,
    'quote_requests', quote_requests_count,
    'generated_designs', generated_designs_count,
    'floor_plans_3d', floor_plans_3d_count,
    'floor_plans', floor_plans_count,
    'portfolio_projects', portfolio_projects_count,
    'portfolio', portfolio_count,
    'user_prices', user_prices_count,
    'calculator_data', calculator_count,
    'appointments', appointments_count,
    'clients', clients_count,
    'projects', projects_count
  );
  
  RETURN json_build_object(
    'success', true,
    'message', 'Usuario eliminado correctamente',
    'deleted_counts', deleted_counts
  );
  
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
