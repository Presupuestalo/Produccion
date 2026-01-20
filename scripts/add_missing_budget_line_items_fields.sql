-- Adding missing fields to budget_line_items table to match TypeScript interface

-- Add missing fields if they don't exist
DO $$
BEGIN
  -- Add color field
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='budget_line_items' AND column_name='color') THEN
    ALTER TABLE budget_line_items ADD COLUMN color TEXT;
  END IF;
  
  -- Add brand field
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='budget_line_items' AND column_name='brand') THEN
    ALTER TABLE budget_line_items ADD COLUMN brand TEXT;
  END IF;
  
  -- Add model field
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='budget_line_items' AND column_name='model') THEN
    ALTER TABLE budget_line_items ADD COLUMN model TEXT;
  END IF;
  
  -- Add base_price_id field (reference to price_master)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='budget_line_items' AND column_name='base_price_id') THEN
    ALTER TABLE budget_line_items ADD COLUMN base_price_id UUID;
  END IF;
  
  -- Add price_type field
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='budget_line_items' AND column_name='price_type') THEN
    ALTER TABLE budget_line_items ADD COLUMN price_type TEXT DEFAULT 'master';
  END IF;
END $$;

-- Create index on base_price_id for better performance
CREATE INDEX IF NOT EXISTS idx_budget_line_items_base_price_id 
ON budget_line_items(base_price_id);
