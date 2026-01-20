-- Crear tabla de documentos de licencia si no existe
CREATE TABLE IF NOT EXISTS public.license_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.license_documents ENABLE ROW LEVEL SECURITY;

-- Solo crear políticas si no existen
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'license_documents' 
    AND policyname = 'Users can view their own license documents'
  ) THEN
    CREATE POLICY "Users can view their own license documents"
      ON public.license_documents
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.projects
          WHERE projects.id = license_documents.project_id
          AND projects.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'license_documents' 
    AND policyname = 'Users can insert their own license documents'
  ) THEN
    CREATE POLICY "Users can insert their own license documents"
      ON public.license_documents
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.projects
          WHERE projects.id = license_documents.project_id
          AND projects.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'license_documents' 
    AND policyname = 'Users can update their own license documents'
  ) THEN
    CREATE POLICY "Users can update their own license documents"
      ON public.license_documents
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.projects
          WHERE projects.id = license_documents.project_id
          AND projects.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'license_documents' 
    AND policyname = 'Users can delete their own license documents'
  ) THEN
    CREATE POLICY "Users can delete their own license documents"
      ON public.license_documents
      FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM public.projects
          WHERE projects.id = license_documents.project_id
          AND projects.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_license_documents_project_id ON public.license_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_license_documents_uploaded_by ON public.license_documents(uploaded_by);
