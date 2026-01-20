-- Sistema de seguridad: Solo una sesión activa por usuario
-- Si el usuario se loguea desde otro dispositivo/IP, se cierra la sesión anterior

-- Crear tabla para guardar sesiones activas
CREATE TABLE IF NOT EXISTS public.active_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT one_session_per_user UNIQUE (user_id)
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_active_sessions_user_id ON public.active_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_token ON public.active_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_active_sessions_last_activity ON public.active_sessions(last_activity);

-- Habilitar RLS
ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver su propia sesión
DROP POLICY IF EXISTS "Users can view own session" ON public.active_sessions;
CREATE POLICY "Users can view own session" ON public.active_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Los usuarios pueden insertar su propia sesión
DROP POLICY IF EXISTS "Users can insert own session" ON public.active_sessions;
CREATE POLICY "Users can insert own session" ON public.active_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios pueden actualizar su propia sesión
DROP POLICY IF EXISTS "Users can update own session" ON public.active_sessions;
CREATE POLICY "Users can update own session" ON public.active_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Política: Los usuarios pueden eliminar su propia sesión
DROP POLICY IF EXISTS "Users can delete own session" ON public.active_sessions;
CREATE POLICY "Users can delete own session" ON public.active_sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Función para limpiar sesiones inactivas (más de 7 días sin actividad)
CREATE OR REPLACE FUNCTION clean_inactive_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.active_sessions
  WHERE last_activity < NOW() - INTERVAL '7 days';
END;
$$;

-- Comentarios para documentación
COMMENT ON TABLE public.active_sessions IS 'Guarda información de sesiones activas para implementar sesión única por usuario';
COMMENT ON COLUMN public.active_sessions.session_token IS 'Token único generado para cada sesión';
COMMENT ON COLUMN public.active_sessions.ip_address IS 'Dirección IP desde donde se inició la sesión';
COMMENT ON COLUMN public.active_sessions.user_agent IS 'Información del navegador/dispositivo';
COMMENT ON COLUMN public.active_sessions.last_activity IS 'Última vez que se verificó la sesión';

SELECT 'Tabla active_sessions creada correctamente' AS status;
