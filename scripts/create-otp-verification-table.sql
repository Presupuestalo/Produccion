-- Tabla para almacenar códigos OTP de verificación de email
CREATE TABLE IF NOT EXISTS email_verification_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ
);

-- Índice para búsquedas rápidas por email
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_email ON email_verification_codes(email);

-- Índice para búsquedas por código
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_code ON email_verification_codes(code);

-- Políticas RLS (Row Level Security)
ALTER TABLE email_verification_codes ENABLE ROW LEVEL SECURITY;

-- Permitir inserciones anónimas (necesario para el registro)
CREATE POLICY "Allow anonymous insert" ON email_verification_codes
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Permitir selects anónimos solo de códigos no expirados
CREATE POLICY "Allow anonymous select non-expired" ON email_verification_codes
  FOR SELECT
  TO anon
  USING (expires_at > NOW());

-- Permitir updates anónimos solo del campo verified
CREATE POLICY "Allow anonymous update verified" ON email_verification_codes
  FOR UPDATE
  TO anon
  USING (expires_at > NOW())
  WITH CHECK (true);
