-- Add is_imported field to price_master table
ALTER TABLE price_master ADD COLUMN IF NOT EXISTS is_imported BOOLEAN DEFAULT false;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_price_master_imported ON price_master(is_imported);

-- Update RLS policy to include is_imported in the description
COMMENT ON COLUMN price_master.is_imported IS 'Indica si el precio fue importado desde un PDF mediante IA';
