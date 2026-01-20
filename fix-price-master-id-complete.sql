-- Script para corregir el tipo de la columna id en price_master
-- Maneja las dependencias de políticas RLS y foreign keys

BEGIN;

-- 1. Eliminar todas las políticas RLS que dependen de price_master.id
DROP POLICY IF EXISTS "Ver historial propio" ON price_history;
DROP POLICY IF EXISTS "Insertar historial propio" ON price_history;
DROP POLICY IF EXISTS "Usuarios pueden ver precios" ON price_master;
DROP POLICY IF EXISTS "Usuarios pueden crear precios personalizados" ON price_master;
DROP POLICY IF EXISTS "Usuarios pueden editar sus precios personalizados" ON price_master;
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus precios personalizados" ON price_master;

-- 2. Eliminar foreign keys que dependen de price_master.id
ALTER TABLE price_history 
DROP CONSTRAINT IF EXISTS price_history_price_id_fkey;

-- 3. Cambiar el tipo de columna de text a uuid en price_master
ALTER TABLE price_master 
ALTER COLUMN id TYPE uuid USING id::uuid;

-- 4. Asegurar que el default esté configurado correctamente
ALTER TABLE price_master 
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 5. Cambiar el tipo en price_history también
ALTER TABLE price_history 
ALTER COLUMN price_id TYPE uuid USING price_id::uuid;

-- 6. Recrear el foreign key
ALTER TABLE price_history
ADD CONSTRAINT price_history_price_id_fkey 
FOREIGN KEY (price_id) REFERENCES price_master(id) ON DELETE CASCADE;

-- 7. Recrear las políticas RLS para price_master
CREATE POLICY "Usuarios pueden ver precios"
ON price_master FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuarios pueden crear precios personalizados"
ON price_master FOR INSERT
TO authenticated
WITH CHECK (
  is_custom = true 
  AND created_by = auth.uid()
);

CREATE POLICY "Usuarios pueden editar sus precios personalizados"
ON price_master FOR UPDATE
TO authenticated
USING (
  is_custom = true 
  AND created_by = auth.uid()
)
WITH CHECK (
  is_custom = true 
  AND created_by = auth.uid()
);

CREATE POLICY "Usuarios pueden eliminar sus precios personalizados"
ON price_master FOR DELETE
TO authenticated
USING (
  is_custom = true 
  AND created_by = auth.uid()
);

-- 8. Recrear las políticas RLS para price_history
CREATE POLICY "Ver historial propio"
ON price_history FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM price_master
    WHERE price_master.id = price_history.price_id
    AND (price_master.is_custom = false OR price_master.created_by = auth.uid())
  )
);

CREATE POLICY "Insertar historial propio"
ON price_history FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM price_master
    WHERE price_master.id = price_history.price_id
    AND (price_master.is_custom = false OR price_master.created_by = auth.uid())
  )
);

-- 9. Verificar que todo está correcto
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'price_master'
AND column_name IN ('id', 'created_at', 'updated_at')
ORDER BY column_name;

COMMIT;
