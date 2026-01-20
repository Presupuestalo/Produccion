-- Añadir políticas RLS para permitir a usuarios master editar precios por país

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Master users can insert prices by country" ON price_master_by_country;
DROP POLICY IF EXISTS "Master users can update prices by country" ON price_master_by_country;
DROP POLICY IF EXISTS "Master users can delete prices by country" ON price_master_by_country;

-- Política: Usuarios master pueden insertar precios por país
CREATE POLICY "Master users can insert prices by country"
  ON price_master_by_country
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'master'
    )
  );

-- Política: Usuarios master pueden actualizar precios por país
CREATE POLICY "Master users can update prices by country"
  ON price_master_by_country
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'master'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'master'
    )
  );

-- Política: Usuarios master pueden eliminar precios por país
CREATE POLICY "Master users can delete prices by country"
  ON price_master_by_country
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'master'
    )
  );

-- Verificar que las políticas se crearon correctamente
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'price_master_by_country'
ORDER BY policyname;
