-- Función para eliminar un usuario y todos sus datos relacionados de forma segura
-- Esto es necesario porque algunas tablas no tienen ON DELETE CASCADE

CREATE OR REPLACE FUNCTION delete_user_and_related_data(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  deleted_counts JSON;
  projects_count INT;
  calculator_count INT;
  clients_count INT;
  budgets_count INT;
  appointments_count INT;
  floor_plans_count INT;
  quotes_count INT;
BEGIN
  -- Contar registros antes de eliminar
  SELECT COUNT(*) INTO projects_count FROM projects WHERE user_id = user_uuid;
  SELECT COUNT(*) INTO calculator_count FROM calculator_data WHERE user_id = user_uuid;
  SELECT COUNT(*) INTO clients_count FROM clients WHERE user_id = user_uuid;
  SELECT COUNT(*) INTO budgets_count FROM budgets WHERE user_id = user_uuid;
  SELECT COUNT(*) INTO appointments_count FROM project_appointments WHERE user_id = user_uuid;
  SELECT COUNT(*) INTO floor_plans_count FROM floor_plans WHERE user_id = user_uuid;
  SELECT COUNT(*) INTO quotes_count FROM quote_requests WHERE user_id = user_uuid;

  -- Eliminar en orden (de hijos a padres para evitar conflictos de FK)
  
  -- 1. Eliminar datos relacionados con proyectos
  DELETE FROM room_photos WHERE project_id IN (SELECT id FROM projects WHERE user_id = user_uuid);
  DELETE FROM project_floor_plans WHERE project_id IN (SELECT id FROM projects WHERE user_id = user_uuid);
  DELETE FROM project_licenses WHERE project_id IN (SELECT id FROM projects WHERE user_id = user_uuid);
  DELETE FROM project_contracts WHERE project_id IN (SELECT id FROM projects WHERE user_id = user_uuid);
  DELETE FROM contract_clauses WHERE project_id IN (SELECT id FROM projects WHERE user_id = user_uuid);
  DELETE FROM budget_settings WHERE project_id IN (SELECT id FROM projects WHERE user_id = user_uuid);
  
  -- 2. Eliminar calculator_data (debe ir antes que projects)
  DELETE FROM calculator_data WHERE user_id = user_uuid;
  
  -- 3. Eliminar budgets (debe ir antes que projects)
  DELETE FROM budgets WHERE user_id = user_uuid;
  
  -- 4. Eliminar proyectos
  DELETE FROM projects WHERE user_id = user_uuid;
  
  -- 5. Eliminar clientes y citas
  DELETE FROM project_appointments WHERE user_id = user_uuid;
  DELETE FROM clients WHERE user_id = user_uuid;
  
  -- 6. Eliminar planos y diseños
  DELETE FROM floor_plans_3d WHERE user_id = user_uuid;
  DELETE FROM floor_plans WHERE user_id = user_uuid;
  DELETE FROM generated_designs WHERE user_id = user_uuid;
  
  -- 7. Eliminar presupuestos y comparaciones
  DELETE FROM budget_comparisons WHERE user_id = user_uuid;
  DELETE FROM quote_offers WHERE request_id IN (SELECT id FROM quote_requests WHERE user_id = user_uuid);
  DELETE FROM quote_requests WHERE user_id = user_uuid;
  
  -- 8. Eliminar configuraciones de usuario
  DELETE FROM user_company_settings WHERE user_id = user_uuid;
  DELETE FROM user_prices WHERE user_id = user_uuid;
  DELETE FROM budget_settings WHERE user_id = user_uuid;
  
  -- 9. Eliminar portafolio profesional
  DELETE FROM professional_portfolio_images WHERE portfolio_id IN (SELECT id FROM professional_portfolio WHERE user_id = user_uuid);
  DELETE FROM professional_portfolio WHERE user_id = user_uuid;
  DELETE FROM professional_subscriptions WHERE user_id = user_uuid;
  
  -- 10. Eliminar quick estimates
  DELETE FROM quick_estimates WHERE user_id = user_uuid;
  
  -- 11. Eliminar el perfil del usuario
  DELETE FROM profiles WHERE id = user_uuid;
  
  -- 12. Eliminar el usuario de auth (esto debe ser lo último)
  DELETE FROM auth.users WHERE id = user_uuid;
  
  -- Crear JSON con el resumen de eliminaciones
  deleted_counts := json_build_object(
    'user_id', user_uuid,
    'projects_deleted', projects_count,
    'calculator_data_deleted', calculator_count,
    'clients_deleted', clients_count,
    'budgets_deleted', budgets_count,
    'appointments_deleted', appointments_count,
    'floor_plans_deleted', floor_plans_count,
    'quotes_deleted', quotes_count,
    'success', true,
    'message', 'Usuario y todos sus datos relacionados eliminados correctamente'
  );
  
  RETURN deleted_counts;
  
EXCEPTION WHEN OTHERS THEN
  -- Si hay algún error, devolver información del error
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM,
    'message', 'Error al eliminar el usuario'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dar permisos para ejecutar la función
GRANT EXECUTE ON FUNCTION delete_user_and_related_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user_and_related_data(UUID) TO service_role;

-- Comentario explicativo
COMMENT ON FUNCTION delete_user_and_related_data IS 
'Elimina un usuario y todos sus datos relacionados de forma segura, respetando el orden de las dependencias de foreign keys. Devuelve un JSON con el resumen de eliminaciones.';
