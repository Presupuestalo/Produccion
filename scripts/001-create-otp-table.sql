-- Crear tabla para códigos de verificación por email
CREATE TABLE IF NOT EXISTS email_verification_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsquedas rápidas por email
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_email ON email_verification_codes(email);

-- Índice para limpiar códigos expirados
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_expires_at ON email_verification_codes(expires_at);

-- Política RLS para permitir inserción sin autenticación (solo para el service role)
ALTER TABLE email_verification_codes ENABLE ROW LEVEL SECURITY;

-- Permitir al service role hacer todo
CREATE POLICY "Service role can do everything" ON email_verification_codes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
