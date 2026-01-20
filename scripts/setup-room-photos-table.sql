-- Crear tabla room_photos si no existe
CREATE TABLE IF NOT EXISTS room_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  room_name TEXT,
  photo_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  phase TEXT NOT NULL CHECK (phase IN ('before', 'during', 'after')),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_room_photos_project_id ON room_photos(project_id);
CREATE INDEX IF NOT EXISTS idx_room_photos_phase ON room_photos(phase);
CREATE INDEX IF NOT EXISTS idx_room_photos_room_name ON room_photos(room_name);

-- Habilitar RLS
ALTER TABLE room_photos ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver las fotos de sus propios proyectos
DROP POLICY IF EXISTS "Users can view their own room photos" ON room_photos;
CREATE POLICY "Users can view their own room photos" ON room_photos
  FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Política: Los usuarios pueden insertar fotos en sus propios proyectos
DROP POLICY IF EXISTS "Users can insert room photos" ON room_photos;
CREATE POLICY "Users can insert room photos" ON room_photos
  FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Política: Los usuarios pueden actualizar fotos de sus propios proyectos
DROP POLICY IF EXISTS "Users can update their own room photos" ON room_photos;
CREATE POLICY "Users can update their own room photos" ON room_photos
  FOR UPDATE
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Política: Los usuarios pueden eliminar fotos de sus propios proyectos
DROP POLICY IF EXISTS "Users can delete their own room photos" ON room_photos;
CREATE POLICY "Users can delete their own room photos" ON room_photos
  FOR DELETE
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );
