-- Add lead_type column to differentiate between normal (landing) and premium (calculator) leads
ALTER TABLE lead_requests 
ADD COLUMN IF NOT EXISTS lead_type TEXT DEFAULT 'normal' 
CHECK (lead_type IN ('normal', 'premium'));

-- Update existing leads to premium (they were created from calculator)
UPDATE lead_requests 
SET lead_type = 'premium' 
WHERE lead_type IS NULL;

-- Add index for filtering by lead type
CREATE INDEX IF NOT EXISTS idx_lead_requests_lead_type ON lead_requests(lead_type);

-- Create phone verifications tracking table
CREATE TABLE IF NOT EXISTS phone_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone TEXT NOT NULL,
  verified_at TIMESTAMPTZ DEFAULT NOW(),
  lead_request_id UUID REFERENCES lead_requests(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint: one lead per phone number (active)
CREATE UNIQUE INDEX IF NOT EXISTS idx_phone_active_lead 
ON phone_verifications(phone, lead_request_id);

-- Index for quick phone lookups
CREATE INDEX IF NOT EXISTS idx_phone_verifications_phone ON phone_verifications(phone);

COMMENT ON COLUMN lead_requests.lead_type IS 'Type of lead: normal (from landing/estimation) or premium (from calculator)';
COMMENT ON TABLE phone_verifications IS 'Tracks phone verification for lead creation - ensures one lead per phone';
