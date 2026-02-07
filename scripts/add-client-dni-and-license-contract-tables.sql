-- Add DNI field to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_dni VARCHAR(20);

-- Create license_documents table for storing license PDFs
CREATE TABLE IF NOT EXISTS license_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  uploaded_by UUID REFERENCES auth.users(id),
  notes TEXT
);

-- Create contracts table for storing contract data
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  budget_id UUID REFERENCES budgets(id),
  contract_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  signed_date DATE,
  client_signature_url TEXT,
  company_signature_url TEXT,
  status VARCHAR(50) DEFAULT 'draft'
);

-- Create contract_clauses table for customizable contract clauses
CREATE TABLE IF NOT EXISTS contract_clauses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  clause_number INTEGER NOT NULL,
  clause_text TEXT NOT NULL,
  is_custom BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(contract_id, clause_number)
);

-- Add RLS policies
ALTER TABLE license_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_clauses ENABLE ROW LEVEL SECURITY;

-- License documents policies
DROP POLICY IF EXISTS "Users can view their own license documents" ON license_documents;
CREATE POLICY "Users can view their own license documents"
  ON license_documents FOR SELECT
  USING (auth.uid() IN (
    SELECT user_id FROM projects WHERE id = license_documents.project_id
  ));

DROP POLICY IF EXISTS "Users can insert their own license documents" ON license_documents;
CREATE POLICY "Users can insert their own license documents"
  ON license_documents FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT user_id FROM projects WHERE id = license_documents.project_id
  ));

DROP POLICY IF EXISTS "Users can update their own license documents" ON license_documents;
CREATE POLICY "Users can update their own license documents"
  ON license_documents FOR UPDATE
  USING (auth.uid() IN (
    SELECT user_id FROM projects WHERE id = license_documents.project_id
  ));

DROP POLICY IF EXISTS "Users can delete their own license documents" ON license_documents;
CREATE POLICY "Users can delete their own license documents"
  ON license_documents FOR DELETE
  USING (auth.uid() IN (
    SELECT user_id FROM projects WHERE id = license_documents.project_id
  ));

-- Contracts policies
DROP POLICY IF EXISTS "Users can view their own contracts" ON contracts;
CREATE POLICY "Users can view their own contracts"
  ON contracts FOR SELECT
  USING (auth.uid() IN (
    SELECT user_id FROM projects WHERE id = contracts.project_id
  ));

DROP POLICY IF EXISTS "Users can insert their own contracts" ON contracts;
CREATE POLICY "Users can insert their own contracts"
  ON contracts FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT user_id FROM projects WHERE id = contracts.project_id
  ));

DROP POLICY IF EXISTS "Users can update their own contracts" ON contracts;
CREATE POLICY "Users can update their own contracts"
  ON contracts FOR UPDATE
  USING (auth.uid() IN (
    SELECT user_id FROM projects WHERE id = contracts.project_id
  ));

-- Contract clauses policies
DROP POLICY IF EXISTS "Users can view their own contract clauses" ON contract_clauses;
CREATE POLICY "Users can view their own contract clauses"
  ON contract_clauses FOR SELECT
  USING (auth.uid() IN (
    SELECT user_id FROM projects p
    JOIN contracts c ON c.project_id = p.id
    WHERE c.id = contract_clauses.contract_id
  ));

DROP POLICY IF EXISTS "Users can insert their own contract clauses" ON contract_clauses;
CREATE POLICY "Users can insert their own contract clauses"
  ON contract_clauses FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT user_id FROM projects p
    JOIN contracts c ON c.project_id = p.id
    WHERE c.id = contract_clauses.contract_id
  ));

DROP POLICY IF EXISTS "Users can update their own contract clauses" ON contract_clauses;
CREATE POLICY "Users can update their own contract clauses"
  ON contract_clauses FOR UPDATE
  USING (auth.uid() IN (
    SELECT user_id FROM projects p
    JOIN contracts c ON c.project_id = p.id
    WHERE c.id = contract_clauses.contract_id
  ));

DROP POLICY IF EXISTS "Users can delete their own contract clauses" ON contract_clauses;
CREATE POLICY "Users can delete their own contract clauses"
  ON contract_clauses FOR DELETE
  USING (auth.uid() IN (
    SELECT user_id FROM projects p
    JOIN contracts c ON c.project_id = p.id
    WHERE c.id = contract_clauses.contract_id
  ));
