-- Migration to move Carpintería premarcos to Albañilería
-- This script finds any price with "premarco" in subcategory or description under Carpintería 
-- and moves it to Albañilería, replacing the '-C-' in its code with '-A-'.

DO $$
DECLARE
    cat_carpinteria UUID;
    cat_albanileria UUID;
    v_record RECORD;
    v_new_code TEXT;
BEGIN
    -- Get Category IDs
    SELECT id INTO cat_carpinteria FROM price_categories WHERE name ILIKE '%CARPINTERÍA%' LIMIT 1;
    SELECT id INTO cat_albanileria FROM price_categories WHERE name ILIKE '%ALBAÑILERÍA%' LIMIT 1;

    -- Ensure both categories exist
    IF cat_carpinteria IS NOT NULL AND cat_albanileria IS NOT NULL THEN
        -- Loop through all premarcos currently in Carpintería
        FOR v_record IN 
            SELECT id, code
            FROM price_master 
            WHERE category_id::uuid = cat_carpinteria 
              AND (subcategory ILIKE '%premarco%' OR description ILIKE '%premarco%')
        LOOP
            -- Replace '-C-' with '-A-' in the code
            v_new_code := REPLACE(v_record.code, '-C-', '-A-');
            
            -- Update the record to the new category and code
            UPDATE price_master 
            SET category_id = cat_albanileria::text,
                code = v_new_code
            WHERE id = v_record.id;
        END LOOP;
    END IF;

END $$;
