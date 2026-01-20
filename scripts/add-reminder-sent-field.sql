-- Agregar campo para rastrear si el recordatorio fue enviado
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false;

-- Agregar campo para rastrear cuándo se envió el recordatorio
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;

-- Crear índice para mejorar el rendimiento de las consultas del cron
CREATE INDEX IF NOT EXISTS idx_appointments_reminder_pending 
ON appointments(appointment_date, reminder_enabled, reminder_sent, status)
WHERE reminder_enabled = true AND reminder_sent = false AND status = 'scheduled';

COMMENT ON COLUMN appointments.reminder_sent IS 'Indica si el email de recordatorio ya fue enviado';
COMMENT ON COLUMN appointments.reminder_sent_at IS 'Fecha y hora en que se envió el recordatorio';
