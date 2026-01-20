-- Add VAT configuration to budget_settings table
ALTER TABLE budget_settings
ADD COLUMN IF NOT EXISTS show_vat BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS vat_percentage NUMERIC(5,2) DEFAULT 21.00;

-- Update existing records to have default values
UPDATE budget_settings
SET show_vat = false, vat_percentage = 21.00
WHERE show_vat IS NULL OR vat_percentage IS NULL;
