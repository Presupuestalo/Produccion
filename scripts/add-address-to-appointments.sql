-- Añadir columna de dirección a la tabla appointments
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS address TEXT;

-- Comentario para la columna
COMMENT ON COLUMN appointments.address IS 'Dirección donde se realizará la cita';
