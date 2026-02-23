-- Remove old carpentry premarco price
-- The premarco will now belong to albañilería under code 05-A-21

DO $$
BEGIN
    DELETE FROM price_master WHERE code = '05-C-21';
END $$;
