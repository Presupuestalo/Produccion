-- Add status field to budget_settings table
ALTER TABLE budget_settings
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'delivered', 'accepted'));

-- Add adjustments field to store additional items after acceptance
ALTER TABLE budget_settings
ADD COLUMN IF NOT EXISTS adjustments JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN budget_settings.status IS 'Budget status: draft, delivered, or accepted';
COMMENT ON COLUMN budget_settings.adjustments IS 'Additional line items added after budget acceptance (can be positive or negative)';
