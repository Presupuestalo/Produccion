-- Add address column to existing appointments table
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS address TEXT NOT NULL DEFAULT '';

-- Update the constraint to make address required for new records
-- (existing records will have empty string as default)
COMMENT ON COLUMN appointments.address IS 'Location/address where the appointment will take place';
