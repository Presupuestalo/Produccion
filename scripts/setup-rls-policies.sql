-- Create RLS policies for calculator_data table
-- Enable RLS on calculator_data table
ALTER TABLE calculator_data ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see only their own data
CREATE POLICY "Users can view own calculator data" ON calculator_data
    FOR SELECT USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own data
CREATE POLICY "Users can insert own calculator data" ON calculator_data
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own data
CREATE POLICY "Users can update own calculator data" ON calculator_data
    FOR UPDATE USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own data
CREATE POLICY "Users can delete own calculator data" ON calculator_data
    FOR DELETE USING (auth.uid() = user_id);

-- Add user_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'calculator_data' AND column_name = 'user_id') THEN
        ALTER TABLE calculator_data ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
END $$;
