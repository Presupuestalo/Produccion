-- Create table for storing license documents
CREATE TABLE IF NOT EXISTS project_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create table for storing contract data
CREATE TABLE IF NOT EXISTS project_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  contract_clauses JSONB NOT NULL DEFAULT '[]',
  client_signature_url TEXT,
  company_signature_url TEXT,
  signed_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_project_licenses_project_id ON project_licenses(project_id);
CREATE INDEX IF NOT EXISTS idx_project_contracts_project_id ON project_contracts(project_id);

-- Enable RLS
ALTER TABLE project_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_contracts ENABLE ROW LEVEL SECURITY;

-- RLS policies for project_licenses
CREATE POLICY "Users can view their own project licenses"
  ON project_licenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own project licenses"
  ON project_licenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own project licenses"
  ON project_licenses FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for project_contracts
CREATE POLICY "Users can view their own project contracts"
  ON project_contracts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own project contracts"
  ON project_contracts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own project contracts"
  ON project_contracts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own project contracts"
  ON project_contracts FOR DELETE
  USING (auth.uid() = user_id);
