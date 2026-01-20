-- Modificar la tabla room_photos para permitir NULL en room_name
-- y agregar un valor por defecto

-- Permitir NULL en room_name
ALTER TABLE room_photos 
ALTER COLUMN room_name DROP NOT NULL;

-- Agregar valor por defecto
ALTER TABLE room_photos 
ALTER COLUMN room_name SET DEFAULT 'Proyecto';

-- Actualizar registros existentes con room_name NULL
UPDATE room_photos 
SET room_name = 'Proyecto' 
WHERE room_name IS NULL;
