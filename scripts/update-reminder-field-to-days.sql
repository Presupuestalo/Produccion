-- Actualizar el campo reminder_minutes_before a reminder_days_before
-- y ajustar la lógica para que funcione con días en lugar de minutos

-- Primero, agregar la nueva columna
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS reminder_days_before INTEGER DEFAULT 1;

-- Copiar los valores existentes convirtiendo minutos a días
-- (1440 minutos = 1 día, 2880 = 2 días, etc.)
UPDATE appointments 
SET reminder_days_before = CASE 
  WHEN reminder_minutes_before >= 2880 THEN 2
  WHEN reminder_minutes_before >= 1440 THEN 1
  ELSE 1
END
WHERE reminder_minutes_before IS NOT NULL;

-- Comentar: Mantener reminder_minutes_before por compatibilidad pero usar reminder_days_before
COMMENT ON COLUMN appointments.reminder_days_before IS 'Días antes de la cita para enviar recordatorio (1, 2, 3, etc.)';
