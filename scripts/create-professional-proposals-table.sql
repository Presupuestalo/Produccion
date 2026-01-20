-- Create professional_proposals table to store proposals from professionals
CREATE TABLE IF NOT EXISTS professional_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_request_id UUID NOT NULL REFERENCES lead_requests(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  proposed_budget DECIMAL(12, 2),
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE professional_proposals ENABLE ROW LEVEL SECURITY;

-- Changed owner_id to homeowner_id to match lead_requests schema
-- Owners can see proposals for their requests
CREATE POLICY "Owners can view proposals for their requests"
  ON professional_proposals
  FOR SELECT
  USING (
    lead_request_id IN (
      SELECT id FROM lead_requests WHERE homeowner_id = auth.uid()
    )
  );

-- Professionals can view their own proposals
CREATE POLICY "Professionals can view their own proposals"
  ON professional_proposals
  FOR SELECT
  USING (professional_id = auth.uid());

-- Professionals can insert their own proposals
CREATE POLICY "Professionals can insert their own proposals"
  ON professional_proposals
  FOR INSERT
  WITH CHECK (professional_id = auth.uid());

-- Professionals can update their own proposals
CREATE POLICY "Professionals can update their own proposals"
  ON professional_proposals
  FOR UPDATE
  USING (professional_id = auth.uid());

-- Create index for faster queries
CREATE INDEX idx_professional_proposals_lead_request ON professional_proposals(lead_request_id);
CREATE INDEX idx_professional_proposals_professional ON professional_proposals(professional_id);
