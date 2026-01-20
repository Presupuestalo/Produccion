-- Migration script to rename project_contracts to contracts
-- and update the foreign key constraint

-- Drop the old foreign key constraint in contract_clauses if it exists
ALTER TABLE IF EXISTS contract_clauses 
DROP CONSTRAINT IF EXISTS contract_clauses_contract_id_fkey;

-- Rename the table if project_contracts exists
ALTER TABLE IF EXISTS project_contracts 
RENAME TO contracts;

-- If the contracts table doesn't exist yet, create it
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contract_number TEXT,
  contract_date TIMESTAMPTZ DEFAULT NOW(),
  company_name TEXT NOT NULL,
  company_cif TEXT NOT NULL,
  company_address TEXT NOT NULL,
  company_logo_url TEXT,
  client_name TEXT NOT NULL,
  client_dni TEXT,
  client_address TEXT NOT NULL,
  reform_address TEXT NOT NULL,
  budget_amount DECIMAL(10, 2) NOT NULL,
  payment_account TEXT,
  client_signature_url TEXT,
  company_signature_url TEXT,
  signature_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add the foreign key constraint to contract_clauses
ALTER TABLE contract_clauses 
ADD CONSTRAINT contract_clauses_contract_id_fkey 
FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE;

-- Enable RLS on contracts table
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own contracts" ON contracts;
DROP POLICY IF EXISTS "Users can insert their own contracts" ON contracts;
DROP POLICY IF EXISTS "Users can update their own contracts" ON contracts;
DROP POLICY IF EXISTS "Users can delete their own contracts" ON contracts;

-- Create RLS policies for contracts
CREATE POLICY "Users can view their own contracts"
  ON contracts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contracts"
  ON contracts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contracts"
  ON contracts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contracts"
  ON contracts FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_contracts_project_id ON contracts(project_id);
CREATE INDEX IF NOT EXISTS idx_contracts_user_id ON contracts(user_id);
