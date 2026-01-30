
-- Minimal SQL script to force master permissions
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'presupuestaloficial@gmail.com';

    IF v_user_id IS NOT NULL THEN
        UPDATE public.profiles 
        SET is_admin = true, role = 'master'
        WHERE id = v_user_id;
        
        RAISE NOTICE 'Admin and Master role set for user %', v_user_id;
    END IF;
END $$;
