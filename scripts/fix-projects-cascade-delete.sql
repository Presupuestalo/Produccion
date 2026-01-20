-- Este script añade ON DELETE CASCADE a la tabla projects
-- para que cuando se elimine un usuario, se eliminen automáticamente todos sus proyectos

-- Primero, verificar si existe una constraint de foreign key en projects.user_id
-- y eliminarla si existe (para poder recrearla con ON DELETE CASCADE)

DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  -- Buscar el nombre de la constraint existente
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'projects'::regclass
    AND contype = 'f'
    AND confrelid = 'auth.users'::regclass;
  
  -- Si existe, eliminarla
  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE projects DROP CONSTRAINT %I', constraint_name);
    RAISE NOTICE 'Constraint eliminada: %', constraint_name;
  END IF;
END $$;

-- Ahora añadir la nueva constraint con ON DELETE CASCADE
ALTER TABLE projects
ADD CONSTRAINT projects_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Verificar que se aplicó correctamente
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'projects'::regclass
      AND contype = 'f'
      AND confrelid = 'auth.users'::regclass
      AND confdeltype = 'c'  -- 'c' significa CASCADE
  ) THEN
    RAISE NOTICE 'SUCCESS: La constraint ON DELETE CASCADE se aplicó correctamente a projects.user_id';
  ELSE
    RAISE EXCEPTION 'ERROR: No se pudo aplicar la constraint ON DELETE CASCADE';
  END IF;
END $$;
