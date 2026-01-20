-- Eliminar el trigger de envío de emails que está causando problemas
-- porque la extensión pg_net no está habilitada

-- Eliminar el trigger si existe
DROP TRIGGER IF EXISTS on_auth_user_created_send_welcome_email ON auth.users;

-- Eliminar la función si existe
DROP FUNCTION IF EXISTS public.send_welcome_email_trigger();

-- Verificar que el trigger de creación de perfiles sigue funcionando
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    RAISE NOTICE 'Trigger de creación de perfiles existe y está activo';
  ELSE
    RAISE NOTICE 'ADVERTENCIA: Trigger de creación de perfiles NO existe';
  END IF;
END $$;
