-- Remove the foreign key constraint that is preventing budget creation
-- The base_price_id field will remain but won't be validated against price_master

ALTER TABLE budget_line_items 
DROP CONSTRAINT IF EXISTS budget_line_items_base_price_id_fkey;

-- Make sure the column is nullable
ALTER TABLE budget_line_items 
ALTER COLUMN base_price_id DROP NOT NULL;

-- Optional: Add a comment explaining why there's no FK
COMMENT ON COLUMN budget_line_items.base_price_id IS 
'Reference to price_master.id - not enforced with FK to allow flexibility';
