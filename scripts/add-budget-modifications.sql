-- Add modifications field to budget_settings table
ALTER TABLE public.budget_settings
ADD COLUMN IF NOT EXISTS modifications JSONB DEFAULT '[]'::jsonb;

-- Add comment explaining the structure
COMMENT ON COLUMN public.budget_settings.modifications IS 'Array of budget modifications with structure: [{id, description, quantity, unit, unit_price, total, notes}]';
