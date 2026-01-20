-- Crear bucket de storage para logos de empresa
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Política para permitir a los usuarios subir sus propios logos
CREATE POLICY "Users can upload their own company logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'company-logos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Política para permitir a los usuarios actualizar sus propios logos
CREATE POLICY "Users can update their own company logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'company-logos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'company-logos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Política para permitir a los usuarios eliminar sus propios logos
CREATE POLICY "Users can delete their own company logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'company-logos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Política para permitir acceso público de lectura a todos los logos
CREATE POLICY "Public access to company logos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'company-logos');
