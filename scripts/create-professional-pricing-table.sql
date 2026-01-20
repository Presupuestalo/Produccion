-- Create professional_pricing table to store prices configured by professionals
-- This allows auto-filling budgets when they accept homeowner requests

CREATE TABLE IF NOT EXISTS professional_pricing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Item details
  description TEXT NOT NULL,
  category TEXT,
  unit TEXT DEFAULT 'ud',
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(professional_id, description)
);

-- Enable RLS
ALTER TABLE professional_pricing ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Professionals manage their own pricing" ON professional_pricing;
CREATE POLICY "Professionals manage their own pricing" ON professional_pricing
  FOR ALL USING (professional_id = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_professional_pricing_professional 
ON professional_pricing(professional_id);

CREATE INDEX IF NOT EXISTS idx_professional_pricing_category 
ON professional_pricing(category);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_professional_pricing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_professional_pricing_updated_at_trigger ON professional_pricing;
CREATE TRIGGER update_professional_pricing_updated_at_trigger
  BEFORE UPDATE ON professional_pricing
  FOR EACH ROW
  EXECUTE FUNCTION update_professional_pricing_updated_at();

-- Comments
COMMENT ON TABLE professional_pricing IS 'Stores unit prices configured by professionals for auto-filling budgets';
COMMENT ON COLUMN professional_pricing.description IS 'Item description (e.g., "Pintura interior", "Instalación eléctrica")';
COMMENT ON COLUMN professional_pricing.unit_price IS 'Price per unit in euros';
