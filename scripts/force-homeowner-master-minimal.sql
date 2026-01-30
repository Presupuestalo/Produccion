
-- Minimal SQL script to force homeowner master permissions
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'propietariopresupuestalo1@gmail.com';

    IF v_user_id IS NOT NULL THEN
        UPDATE public.profiles 
        SET is_admin = true, role = 'master', user_type = 'homeowner'
        WHERE id = v_user_id;
        
        RAISE NOTICE 'Admin, Master role and user_type set for user %', v_user_id;
    END IF;
END $$;
