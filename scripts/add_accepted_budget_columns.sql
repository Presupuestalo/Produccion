-- Add columns to store accepted budget information
ALTER TABLE budgets
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS accepted_amount_without_vat NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS accepted_amount_with_vat NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS accepted_vat_rate NUMERIC(5, 2),
ADD COLUMN IF NOT EXISTS accepted_vat_amount NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS accepted_includes_vat BOOLEAN DEFAULT true;

-- Add comment to explain the columns
COMMENT ON COLUMN budgets.accepted_at IS 'Timestamp when the budget was accepted by the client';
COMMENT ON COLUMN budgets.accepted_amount_without_vat IS 'Total amount without VAT at the time of acceptance';
COMMENT ON COLUMN budgets.accepted_amount_with_vat IS 'Total amount with VAT at the time of acceptance';
COMMENT ON COLUMN budgets.accepted_vat_rate IS 'VAT rate percentage at the time of acceptance';
COMMENT ON COLUMN budgets.accepted_vat_amount IS 'VAT amount at the time of acceptance';
COMMENT ON COLUMN budgets.accepted_includes_vat IS 'Whether the accepted budget includes VAT or not';
