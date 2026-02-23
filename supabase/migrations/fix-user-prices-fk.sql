-- ==============================================================================
-- MIGRATION: Fix Foreign Key and Type for category_id in user_prices tables
-- ==============================================================================
-- This script corrects the data type of the `category_id` column in all 
-- `user_prices` tables (including country-specific like `user_prices_peru`).
-- It changes the type from TEXT to UUID and explicitly adds the Foreign Key 
-- constraint to public.price_categories(id). This fixes the PGRST200 error 
-- where Supabase cannot find the relationship.
-- ==============================================================================

DO $$
DECLARE
  table_record RECORD;
BEGIN
  FOR table_record IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name LIKE 'user_prices%'
  LOOP
    
    -- 1. Alter column type to TEXT to match price_categories.id
    EXECUTE format('
      ALTER TABLE public.%I 
      ALTER COLUMN category_id TYPE TEXT USING category_id::text;
    ', table_record.table_name);
    
    -- 2. Drop the foreign key constraint if it exists (to avoid duplicates)
    EXECUTE format('
      ALTER TABLE public.%I 
      DROP CONSTRAINT IF EXISTS fk_%I_category;
    ', table_record.table_name, table_record.table_name);

    -- 3. Add the proper Foreign Key constraint to price_categories
    EXECUTE format('
      ALTER TABLE public.%I 
      ADD CONSTRAINT fk_%I_category 
      FOREIGN KEY (category_id) 
      REFERENCES public.price_categories(id) 
      ON DELETE CASCADE;
    ', table_record.table_name, table_record.table_name, table_record.table_name);

  END LOOP;
END $$;

-- 4. Force PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';
