-- Add client address fields to projects table
-- These fields store the client's personal address (different from reform location)

-- Add client country
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS client_country TEXT;

-- Add client street address
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS client_street TEXT;

-- Add client city
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS client_city TEXT;

-- Add client province/state
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS client_province TEXT;

-- Add client postal code
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS client_postal_code TEXT;

-- Add comments to document the fields
COMMENT ON COLUMN projects.client_country IS 'Country where the client lives (ISO code)';
COMMENT ON COLUMN projects.client_street IS 'Client street address';
COMMENT ON COLUMN projects.client_city IS 'Client city';
COMMENT ON COLUMN projects.client_province IS 'Client province/state';
COMMENT ON COLUMN projects.client_postal_code IS 'Client postal/ZIP code';
