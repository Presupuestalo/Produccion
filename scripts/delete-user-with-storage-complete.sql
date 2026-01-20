-- SCRIPT PARA ELIMINACIÓN AUTOMÁTICA DE IMÁGENES AL BORRAR USUARIOS
-- Implementa un trigger que limpia Supabase Storage cuando un usuario es eliminado.

-- 1. Función para limpiar Storage
CREATE OR REPLACE FUNCTION public.handle_storage_cleanup_on_user_deletion() 
RETURNS TRIGGER AS $$
BEGIN
  -- Eliminamos los metadatos de los archivos del usuario en todos los buckets
  -- Supabase Storage eliminará los archivos reales físicamente del bucket.
  -- Buscamos por 'owner' y también por carpetas que empiecen con el UUID del usuario.
  DELETE FROM storage.objects 
  WHERE owner = OLD.id 
     OR (storage.foldername(name))[1] = OLD.id::text;
     
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Asegurar que el trigger esté en la tabla profiles
-- Dado que profiles tiene ON DELETE CASCADE con auth.users, 
-- al borrar en auth.users se borrará en profiles y saltará este trigger.
DROP TRIGGER IF EXISTS trigger_cleanup_storage_on_profile_delete ON public.profiles;

CREATE TRIGGER trigger_cleanup_storage_on_profile_delete
  BEFORE DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_storage_cleanup_on_user_deletion();

-- 3. Actualizar la función de borrado manual para que sea coherente
-- Esta función ahora solo necesita preocuparse por el orden de borrado de tablas
-- la parte de storage ya la hará el trigger de arriba automáticamente al borrar el perfil.

CREATE OR REPLACE FUNCTION delete_user_and_related_data(user_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  deleted_counts jsonb := '{}'::jsonb;
  v_count integer;
BEGIN
  -- El trigger 'trigger_cleanup_storage_on_profile_delete' se encargará de 
  -- borrar storage.objects cuando eliminemos el perfil al final.

  -- Borrar datos de tablas que podrían no tener CASCADE o que queremos contar
  
  -- Profesionales
  BEGIN
    DELETE FROM professional_work_photos WHERE work_id IN (SELECT id FROM professional_works WHERE user_id = user_uuid);
    DELETE FROM professional_works WHERE user_id = user_uuid;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN
    DELETE FROM portfolio_images WHERE portfolio_id IN (SELECT id FROM professional_portfolio WHERE user_id = user_uuid);
    DELETE FROM professional_portfolio WHERE user_id = user_uuid;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  -- Propietarios / Proyectos
  BEGIN
    DELETE FROM room_photos WHERE project_id IN (SELECT id FROM projects WHERE user_id = user_uuid);
  EXCEPTION WHEN OTHERS THEN NULL; END;

  -- Todo lo demás que use user_id
  BEGIN DELETE FROM floor_plans_3d WHERE user_id = user_uuid; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DELETE FROM project_floor_plans WHERE user_id = user_uuid; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DELETE FROM generated_designs WHERE user_id = user_uuid; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DELETE FROM calculator_data WHERE user_id = user_uuid; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DELETE FROM budgets WHERE user_id = user_uuid; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DELETE FROM budget_comparisons WHERE user_id = user_uuid; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DELETE FROM project_appointments WHERE user_id = user_uuid; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DELETE FROM clients WHERE user_id = user_uuid; EXCEPTION WHEN OTHERS THEN NULL; END;

  -- Marketplace
  BEGIN DELETE FROM professional_proposals WHERE professional_id = user_uuid; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DELETE FROM quote_offers WHERE professional_id = user_uuid; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DELETE FROM quote_requests WHERE homeowner_id = user_uuid; EXCEPTION WHEN OTHERS THEN NULL; END;

  -- Proyectos final
  BEGIN DELETE FROM projects WHERE user_id = user_uuid; EXCEPTION WHEN OTHERS THEN NULL; END;

  -- Al borrar el perfil, saltará el trigger de limpieza de Storage
  DELETE FROM public.profiles WHERE id = user_uuid;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{profiles}', to_jsonb(v_count));

  -- Finalmente borrar el usuario de Auth
  DELETE FROM auth.users WHERE id = user_uuid;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{auth_users}', to_jsonb(v_count));

  RETURN jsonb_build_object(
    'success', true,
    'deleted_counts', deleted_counts,
    'message', 'Usuario e imágenes eliminados correctamente.'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;
