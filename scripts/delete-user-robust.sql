-- Drop existing function if it exists
DROP FUNCTION IF EXISTS delete_user_and_related_data(uuid);

-- Create a robust function that only deletes from tables we know exist
CREATE OR REPLACE FUNCTION delete_user_and_related_data(user_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_counts jsonb := '{}'::jsonb;
  v_count integer;
BEGIN
  -- Delete room photos (if table exists and has user_id)
  BEGIN
    DELETE FROM room_photos WHERE user_id = user_uuid;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    deleted_counts := jsonb_set(deleted_counts, '{room_photos}', to_jsonb(v_count));
  EXCEPTION WHEN OTHERS THEN
    deleted_counts := jsonb_set(deleted_counts, '{room_photos}', '"error"'::jsonb);
  END;

  -- Delete floor plans 3D
  BEGIN
    DELETE FROM floor_plans_3d WHERE user_id = user_uuid;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    deleted_counts := jsonb_set(deleted_counts, '{floor_plans_3d}', to_jsonb(v_count));
  EXCEPTION WHEN OTHERS THEN
    deleted_counts := jsonb_set(deleted_counts, '{floor_plans_3d}', '"error"'::jsonb);
  END;

  -- Delete floor plans
  BEGIN
    DELETE FROM project_floor_plans WHERE user_id = user_uuid;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    deleted_counts := jsonb_set(deleted_counts, '{project_floor_plans}', to_jsonb(v_count));
  EXCEPTION WHEN OTHERS THEN
    deleted_counts := jsonb_set(deleted_counts, '{project_floor_plans}', '"error"'::jsonb);
  END;

  -- Delete generated designs
  BEGIN
    DELETE FROM generated_designs WHERE user_id = user_uuid;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    deleted_counts := jsonb_set(deleted_counts, '{generated_designs}', to_jsonb(v_count));
  EXCEPTION WHEN OTHERS THEN
    deleted_counts := jsonb_set(deleted_counts, '{generated_designs}', '"error"'::jsonb);
  END;

  -- Delete budget comparisons
  BEGIN
    DELETE FROM budget_comparisons WHERE user_id = user_uuid;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    deleted_counts := jsonb_set(deleted_counts, '{budget_comparisons}', to_jsonb(v_count));
  EXCEPTION WHEN OTHERS THEN
    deleted_counts := jsonb_set(deleted_counts, '{budget_comparisons}', '"error"'::jsonb);
  END;

  -- Delete appointments
  BEGIN
    DELETE FROM project_appointments WHERE user_id = user_uuid;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    deleted_counts := jsonb_set(deleted_counts, '{project_appointments}', to_jsonb(v_count));
  EXCEPTION WHEN OTHERS THEN
    deleted_counts := jsonb_set(deleted_counts, '{project_appointments}', '"error"'::jsonb);
  END;

  -- Delete clients
  BEGIN
    DELETE FROM clients WHERE user_id = user_uuid;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    deleted_counts := jsonb_set(deleted_counts, '{clients}', to_jsonb(v_count));
  EXCEPTION WHEN OTHERS THEN
    deleted_counts := jsonb_set(deleted_counts, '{clients}', '"error"'::jsonb);
  END;

  -- Delete calculator data
  BEGIN
    DELETE FROM calculator_data WHERE user_id = user_uuid;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    deleted_counts := jsonb_set(deleted_counts, '{calculator_data}', to_jsonb(v_count));
  EXCEPTION WHEN OTHERS THEN
    deleted_counts := jsonb_set(deleted_counts, '{calculator_data}', '"error"'::jsonb);
  END;

  -- Delete projects
  BEGIN
    DELETE FROM projects WHERE user_id = user_uuid;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    deleted_counts := jsonb_set(deleted_counts, '{projects}', to_jsonb(v_count));
  EXCEPTION WHEN OTHERS THEN
    deleted_counts := jsonb_set(deleted_counts, '{projects}', '"error"'::jsonb);
  END;

  -- Delete user prices
  BEGIN
    DELETE FROM user_prices WHERE user_id = user_uuid;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    deleted_counts := jsonb_set(deleted_counts, '{user_prices}', to_jsonb(v_count));
  EXCEPTION WHEN OTHERS THEN
    deleted_counts := jsonb_set(deleted_counts, '{user_prices}', '"error"'::jsonb);
  END;

  -- Delete user subscriptions
  BEGIN
    DELETE FROM user_subscriptions WHERE user_id = user_uuid;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    deleted_counts := jsonb_set(deleted_counts, '{user_subscriptions}', to_jsonb(v_count));
  EXCEPTION WHEN OTHERS THEN
    deleted_counts := jsonb_set(deleted_counts, '{user_subscriptions}', '"error"'::jsonb);
  END;

  -- Delete profile
  BEGIN
    DELETE FROM profiles WHERE id = user_uuid;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    deleted_counts := jsonb_set(deleted_counts, '{profiles}', to_jsonb(v_count));
  EXCEPTION WHEN OTHERS THEN
    deleted_counts := jsonb_set(deleted_counts, '{profiles}', '"error"'::jsonb);
  END;

  -- Delete from auth.users (requires SECURITY DEFINER)
  BEGIN
    DELETE FROM auth.users WHERE id = user_uuid;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    deleted_counts := jsonb_set(deleted_counts, '{auth_users}', to_jsonb(v_count));
  EXCEPTION WHEN OTHERS THEN
    deleted_counts := jsonb_set(deleted_counts, '{auth_users}', '"error"'::jsonb);
  END;

  RETURN jsonb_build_object(
    'success', true,
    'deleted_counts', deleted_counts,
    'message', 'Usuario eliminado correctamente'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'message', 'Error al eliminar el usuario: ' || SQLERRM
  );
END;
$$;
