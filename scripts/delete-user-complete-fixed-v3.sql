
-- Final fixed script for user deletion
-- Handles all tables with correct column names and order

DROP FUNCTION IF EXISTS delete_user_and_related_data(uuid);

CREATE OR REPLACE FUNCTION delete_user_and_related_data(user_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_counts jsonb := '{}'::jsonb;
  v_count integer;
BEGIN
  -- 1. room_photos (by user_id)
  DELETE FROM room_photos WHERE user_id = user_uuid;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{room_photos}', to_jsonb(v_count));

  -- 2. budget_line_items (via budgets)
  DELETE FROM budget_line_items WHERE budget_id IN (SELECT id FROM budgets WHERE user_id = user_uuid);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{budget_line_items}', to_jsonb(v_count));

  -- 3. budget_comparisons (by user_id)
  BEGIN
    DELETE FROM budget_comparisons WHERE user_id = user_uuid;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    deleted_counts := jsonb_set(deleted_counts, '{budget_comparisons}', to_jsonb(v_count));
  EXCEPTION WHEN OTHERS THEN
    deleted_counts := jsonb_set(deleted_counts, '{budget_comparisons}', '"error"'::jsonb);
  END;

  -- 4. budgets (by user_id)
  DELETE FROM budgets WHERE user_id = user_uuid;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{budgets}', to_jsonb(v_count));

  -- 5. calculator_data (via projects)
  DELETE FROM calculator_data WHERE project_id IN (SELECT id FROM projects WHERE user_id = user_uuid);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{calculator_data}', to_jsonb(v_count));

  -- 6. project_floor_plans (via projects)
  DELETE FROM project_floor_plans WHERE project_id IN (SELECT id FROM projects WHERE user_id = user_uuid);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{project_floor_plans}', to_jsonb(v_count));

  -- 7. budget_settings (via projects)
  DELETE FROM budget_settings WHERE project_id IN (SELECT id FROM projects WHERE user_id = user_uuid);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{budget_settings}', to_jsonb(v_count));

  -- 8. floor_plans (by user_id)
  BEGIN
    DELETE FROM floor_plans WHERE user_id = user_uuid;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    deleted_counts := jsonb_set(deleted_counts, '{floor_plans}', to_jsonb(v_count));
  EXCEPTION WHEN OTHERS THEN
    deleted_counts := jsonb_set(deleted_counts, '{floor_plans}', '"error"'::jsonb);
  END;

  -- 9. projects (by user_id)
  DELETE FROM projects WHERE user_id = user_uuid;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{projects}', to_jsonb(v_count));

  -- 10. quote_requests (by user_id)
  DELETE FROM quote_requests WHERE user_id = user_uuid;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{quote_requests}', to_jsonb(v_count));

  -- 11. quote_offers (by professional_id)
  DELETE FROM quote_offers WHERE professional_id = user_uuid;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{quote_offers}', to_jsonb(v_count));

  -- 12. professional_portfolio (by user_id)
  DELETE FROM professional_portfolio WHERE user_id = user_uuid;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{professional_portfolio}', to_jsonb(v_count));

  -- 13. project_appointments (by user_id)
  DELETE FROM project_appointments WHERE user_id = user_uuid;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{project_appointments}', to_jsonb(v_count));

  -- 14. clients (by user_id)
  DELETE FROM clients WHERE user_id = user_uuid;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{clients}', to_jsonb(v_count));

  -- 15. user_company_settings (by user_id)
  DELETE FROM user_company_settings WHERE user_id = user_uuid;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{user_company_settings}', to_jsonb(v_count));

  -- 16. user_prices (by user_id)
  DELETE FROM user_prices WHERE user_id = user_uuid;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{user_prices}', to_jsonb(v_count));

  -- 17. user_subscriptions (by user_id)
  DELETE FROM user_subscriptions WHERE user_id = user_uuid;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{user_subscriptions}', to_jsonb(v_count));

  -- 18. profiles (by id)
  DELETE FROM profiles WHERE id = user_uuid;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{profiles}', to_jsonb(v_count));

  -- 19. auth.users (by id)
  DELETE FROM auth.users WHERE id = user_uuid;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{auth_users}', to_jsonb(v_count));

  RETURN jsonb_build_object(
    'success', true,
    'deleted_counts', deleted_counts,
    'message', 'Usuario y datos relacionados eliminados exitosamente'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', SQLSTATE,
    'message', 'Error crítico al eliminar usuario: ' || SQLERRM
  );
END;
$$;
