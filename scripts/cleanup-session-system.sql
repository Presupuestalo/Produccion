-- Script para eliminar completamente el sistema de sesiones únicas
-- Ejecutar este script en Supabase SQL Editor

-- Eliminar la tabla de sesiones activas si existe
DROP TABLE IF EXISTS public.active_sessions CASCADE;

-- Eliminar cualquier función relacionada con sesiones
DROP FUNCTION IF EXISTS public.cleanup_old_sessions() CASCADE;
DROP FUNCTION IF EXISTS public.register_session(uuid, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.check_session_valid(uuid, text) CASCADE;

-- Verificar que todo se eliminó correctamente
DO $$
BEGIN
  RAISE NOTICE 'Sistema de sesiones eliminado correctamente';
  RAISE NOTICE 'Tablas eliminadas: active_sessions';
  RAISE NOTICE 'Funciones eliminadas: cleanup_old_sessions, register_session, check_session_valid';
END $$;
