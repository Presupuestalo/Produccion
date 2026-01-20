-- Migrar el campo has_elevator de valores booleanos/texto a "Sí"/"No"
-- Este script convierte cualquier valor existente al formato correcto

-- Remover la lógica de conversión de booleano ya que el campo es TEXT
-- Si el campo ya es TEXT, solo necesitamos actualizar los valores

-- Actualizar los valores existentes (el campo ya es TEXT)
UPDATE projects
SET has_elevator = CASE 
  -- Manejar valores booleanos como string
  WHEN has_elevator IN ('true', 't', 'TRUE', 'T', '1') THEN 'Sí'
  WHEN has_elevator IN ('false', 'f', 'FALSE', 'F', '0') THEN 'No'
  -- Mantener valores que ya están correctos
  WHEN has_elevator = 'Sí' THEN 'Sí'
  WHEN has_elevator = 'No' THEN 'No'
  -- Cualquier otro valor
  ELSE 'Sin información de ascensor'
END
WHERE has_elevator IS NOT NULL;

-- Establecer un valor por defecto para los registros NULL
UPDATE projects
SET has_elevator = 'Sin información de ascensor'
WHERE has_elevator IS NULL;

-- Agregar un check constraint para asegurar solo valores válidos (si no existe)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'has_elevator_check'
  ) THEN
    ALTER TABLE projects ADD CONSTRAINT has_elevator_check 
      CHECK (has_elevator IN ('Sí', 'No', 'Sin información de ascensor'));
  END IF;
END $$;
