-- Create table for storing contract clauses
CREATE TABLE IF NOT EXISTS contract_clauses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Changed reference from project_contracts to contracts
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  clause_number INTEGER NOT NULL,
  clause_text TEXT NOT NULL,
  is_custom BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_contract_clauses_contract_id ON contract_clauses(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_clauses_order ON contract_clauses(contract_id, clause_number);

-- Enable RLS
ALTER TABLE contract_clauses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view clauses of their own contracts"
  ON contract_clauses FOR SELECT
  USING (
    contract_id IN (
      SELECT id FROM contracts WHERE project_id IN (
        SELECT id FROM projects WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert clauses to their own contracts"
  ON contract_clauses FOR INSERT
  WITH CHECK (
    contract_id IN (
      SELECT id FROM contracts WHERE project_id IN (
        SELECT id FROM projects WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update clauses of their own contracts"
  ON contract_clauses FOR UPDATE
  USING (
    contract_id IN (
      SELECT id FROM contracts WHERE project_id IN (
        SELECT id FROM projects WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete clauses from their own contracts"
  ON contract_clauses FOR DELETE
  USING (
    contract_id IN (
      SELECT id FROM contracts WHERE project_id IN (
        SELECT id FROM projects WHERE user_id = auth.uid()
      )
    )
  );
