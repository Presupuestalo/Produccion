-- Add country support to projects table
-- This stores the country where the reform will take place
-- Important: project country may differ from user's country

-- Add country code for the reform location
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS country_code TEXT DEFAULT 'ES';

-- Add client DNI for billing (professionals will use this)
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS client_dni TEXT;

-- Add index for country-based queries (e.g., pricing by country)
CREATE INDEX IF NOT EXISTS idx_projects_country ON projects(country_code);

-- Add comment to explain the purpose
COMMENT ON COLUMN projects.country_code IS 'ISO country code where the reform is located (may differ from user country)';
COMMENT ON COLUMN projects.client_dni IS 'Client tax ID for billing purposes';
