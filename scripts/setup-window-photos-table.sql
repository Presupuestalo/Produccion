-- Create window_photos table
CREATE TABLE IF NOT EXISTS window_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  window_id TEXT NOT NULL,
  room_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  photo_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT unique_window_photo UNIQUE (project_id, window_id, storage_path)
);

-- Create index for faster queries
CREATE INDEX idx_window_photos_project_id ON window_photos(project_id);
CREATE INDEX idx_window_photos_window_id ON window_photos(window_id);
CREATE INDEX idx_window_photos_user_id ON window_photos(user_id);

-- Enable RLS
ALTER TABLE window_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see photos from their own projects
CREATE POLICY "Users can view their own window photos"
  ON window_photos FOR SELECT
  USING (user_id = auth.uid());

-- RLS Policy: Users can insert photos for their own projects
CREATE POLICY "Users can insert window photos"
  ON window_photos FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- RLS Policy: Users can delete their own photos
CREATE POLICY "Users can delete their own window photos"
  ON window_photos FOR DELETE
  USING (user_id = auth.uid());

-- Update storage bucket if doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('window-photos', 'window-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy for public access to window photos
CREATE POLICY "Public access to window photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'window-photos');

CREATE POLICY "Users can upload window photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'window-photos'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can delete their window photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'window-photos'
    AND auth.uid() IS NOT NULL
  );
