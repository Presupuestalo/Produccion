-- Eliminar versiones anteriores de la función
DROP FUNCTION IF EXISTS delete_user_and_related_data(uuid);
DROP FUNCTION IF EXISTS delete_user_and_related_data(text);

-- Crear la función actualizada
CREATE OR REPLACE FUNCTION delete_user_and_related_data(user_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_counts jsonb := '{}'::jsonb;
  count_val integer;
BEGIN
  -- Eliminar datos en orden correcto respetando foreign keys
  
  -- Eliminar room_photos
  DELETE FROM room_photos WHERE user_id = user_uuid;
  GET DIAGNOSTICS count_val = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{room_photos}', to_jsonb(count_val));

  -- Eliminar project_floor_plans
  DELETE FROM project_floor_plans WHERE user_id = user_uuid;
  GET DIAGNOSTICS count_val = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{project_floor_plans}', to_jsonb(count_val));

  -- Eliminar floor_plans
  DELETE FROM floor_plans WHERE user_id = user_uuid;
  GET DIAGNOSTICS count_val = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{floor_plans}', to_jsonb(count_val));

  -- Eliminar floor_plans_3d
  DELETE FROM floor_plans_3d WHERE user_id = user_uuid;
  GET DIAGNOSTICS count_val = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{floor_plans_3d}', to_jsonb(count_val));

  -- Eliminar generated_designs
  DELETE FROM generated_designs WHERE user_id = user_uuid;
  GET DIAGNOSTICS count_val = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{generated_designs}', to_jsonb(count_val));

  -- Eliminar budget_comparisons
  DELETE FROM budget_comparisons WHERE user_id = user_uuid;
  GET DIAGNOSTICS count_val = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{budget_comparisons}', to_jsonb(count_val));

  -- Eliminar budgets
  DELETE FROM budgets WHERE user_id = user_uuid;
  GET DIAGNOSTICS count_val = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{budgets}', to_jsonb(count_val));

  -- Eliminar calculator_data
  DELETE FROM calculator_data WHERE user_id = user_uuid;
  GET DIAGNOSTICS count_val = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{calculator_data}', to_jsonb(count_val));

  -- Eliminar projects
  DELETE FROM projects WHERE user_id = user_uuid;
  GET DIAGNOSTICS count_val = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{projects}', to_jsonb(count_val));

  -- Eliminar project_appointments
  DELETE FROM project_appointments WHERE user_id = user_uuid;
  GET DIAGNOSTICS count_val = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{project_appointments}', to_jsonb(count_val));

  -- Eliminar clients
  DELETE FROM clients WHERE user_id = user_uuid;
  GET DIAGNOSTICS count_val = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{clients}', to_jsonb(count_val));

  -- Eliminar quote_requests
  DELETE FROM quote_requests WHERE homeowner_id = user_uuid;
  GET DIAGNOSTICS count_val = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{quote_requests}', to_jsonb(count_val));

  -- Eliminar quote_offers
  DELETE FROM quote_offers WHERE professional_id = user_uuid;
  GET DIAGNOSTICS count_val = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{quote_offers}', to_jsonb(count_val));

  -- Eliminar professional_proposals
  DELETE FROM professional_proposals WHERE professional_id = user_uuid;
  GET DIAGNOSTICS count_val = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{professional_proposals}', to_jsonb(count_val));

  -- Eliminar professional_portfolio
  DELETE FROM professional_portfolio WHERE professional_id = user_uuid;
  GET DIAGNOSTICS count_val = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{professional_portfolio}', to_jsonb(count_val));

  -- Eliminar user_company_settings
  DELETE FROM user_company_settings WHERE user_id = user_uuid;
  GET DIAGNOSTICS count_val = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{user_company_settings}', to_jsonb(count_val));

  -- Eliminar budget_settings
  DELETE FROM budget_settings WHERE user_id = user_uuid;
  GET DIAGNOSTICS count_val = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{budget_settings}', to_jsonb(count_val));

  -- Eliminar user_prices
  DELETE FROM user_prices WHERE user_id = user_uuid;
  GET DIAGNOSTICS count_val = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{user_prices}', to_jsonb(count_val));

  -- Eliminar user_subscriptions
  DELETE FROM user_subscriptions WHERE user_id = user_uuid;
  GET DIAGNOSTICS count_val = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{user_subscriptions}', to_jsonb(count_val));

  -- Eliminar coordinator_projects
  DELETE FROM coordinator_projects WHERE coordinator_id = user_uuid;
  GET DIAGNOSTICS count_val = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{coordinator_projects}', to_jsonb(count_val));

  -- Eliminar profiles
  DELETE FROM profiles WHERE id = user_uuid;
  GET DIAGNOSTICS count_val = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{profiles}', to_jsonb(count_val));

  -- Eliminar el usuario de auth.users
  DELETE FROM auth.users WHERE id = user_uuid;
  GET DIAGNOSTICS count_val = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{auth_users}', to_jsonb(count_val));

  RETURN jsonb_build_object(
    'success', true,
    'deleted_counts', deleted_counts,
    'message', 'Usuario eliminado correctamente'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'error_detail', SQLSTATE,
    'message', 'Error al eliminar el usuario: ' || SQLERRM
  );
END;
$$;

-- Otorgar permisos de ejecución
GRANT EXECUTE ON FUNCTION delete_user_and_related_data(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user_and_related_data(uuid) TO service_role;

-- Comentario
COMMENT ON FUNCTION delete_user_and_related_data IS 
'Elimina un usuario y todos sus datos relacionados de forma segura. Retorna un JSON con el resultado de la operación.';
