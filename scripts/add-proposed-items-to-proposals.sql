-- Add proposed_items column to professional_proposals table
ALTER TABLE professional_proposals 
ADD COLUMN IF NOT EXISTS proposed_items JSONB;

-- Add comment for documentation
COMMENT ON COLUMN professional_proposals.proposed_items IS 'JSON array of budget line items with professional prices';
