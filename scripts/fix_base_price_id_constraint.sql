-- Fix base_price_id foreign key constraint issue
-- The field should be nullable and only reference valid price_master IDs

-- Drop the existing foreign key constraint if it exists
DO $$ 
BEGIN
    -- Drop existing foreign key constraint
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'budget_line_items_base_price_id_fkey'
        AND table_name = 'budget_line_items'
    ) THEN
        ALTER TABLE budget_line_items 
        DROP CONSTRAINT budget_line_items_base_price_id_fkey;
        RAISE NOTICE 'Dropped existing base_price_id foreign key constraint';
    END IF;
    
    -- Make sure the column exists and is nullable
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'budget_line_items' 
        AND column_name = 'base_price_id'
    ) THEN
        ALTER TABLE budget_line_items 
        ADD COLUMN base_price_id UUID NULL;
        RAISE NOTICE 'Added base_price_id column';
    ELSE
        -- Make sure it's nullable
        ALTER TABLE budget_line_items 
        ALTER COLUMN base_price_id DROP NOT NULL;
        RAISE NOTICE 'Made base_price_id nullable';
    END IF;
    
    -- Recreate the foreign key constraint but allow NULL values
    -- This allows line items without a base price reference
    ALTER TABLE budget_line_items
    ADD CONSTRAINT budget_line_items_base_price_id_fkey
    FOREIGN KEY (base_price_id) 
    REFERENCES price_master(id) 
    ON DELETE SET NULL;
    
    RAISE NOTICE 'Created new nullable foreign key constraint for base_price_id';
    
    -- Create index if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE indexname = 'idx_budget_line_items_base_price_id'
    ) THEN
        CREATE INDEX idx_budget_line_items_base_price_id 
        ON budget_line_items(base_price_id);
        RAISE NOTICE 'Created index on base_price_id';
    END IF;
    
END $$;

-- Update any invalid base_price_id values to NULL
UPDATE budget_line_items
SET base_price_id = NULL
WHERE base_price_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM price_master WHERE id = budget_line_items.base_price_id
);

-- Add comment
COMMENT ON COLUMN budget_line_items.base_price_id IS 
'Referencia opcional al precio en price_master. NULL para items personalizados o sin referencia.';
