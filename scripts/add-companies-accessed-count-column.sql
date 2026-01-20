-- Add companies_accessed_count column to lead_requests if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lead_requests' AND column_name = 'companies_accessed_count'
  ) THEN
    ALTER TABLE lead_requests ADD COLUMN companies_accessed_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Update existing leads to count their proposals
UPDATE lead_requests lr
SET companies_accessed_count = (
  SELECT COUNT(DISTINCT professional_id)
  FROM professional_proposals pp
  WHERE pp.lead_request_id = lr.id
);
