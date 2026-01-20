-- Add base_price_id column to budget_line_items table
-- This creates a reference to the original price from user_prices or price_master

ALTER TABLE budget_line_items
ADD COLUMN IF NOT EXISTS base_price_id uuid REFERENCES price_master(id) ON DELETE SET NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_budget_line_items_base_price_id 
ON budget_line_items(base_price_id);

-- Add comment to document the column
COMMENT ON COLUMN budget_line_items.base_price_id IS 'Referencia al precio original del catálogo (price_master o user_prices)';
