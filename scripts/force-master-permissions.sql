
-- SQL script to force master permissions for presupuestaloficial@gmail.com
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Get the user ID
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'presupuestaloficial@gmail.com';

    IF v_user_id IS NOT NULL THEN
        -- Force update/insert in profiles
        INSERT INTO public.profiles (
            id, 
            email, 
            full_name, 
            is_admin, 
            role, 
            user_type, 
            subscription_plan, 
            updated_at
        ) 
        VALUES (
            v_user_id, 
            'presupuestaloficial@gmail.com', 
            'Presupuestalo Oficial', 
            true, 
            'master', 
            'company', 
            'premium', 
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            is_admin = true,
            role = 'master',
            user_type = 'company',
            subscription_plan = 'premium',
            updated_at = NOW();
            
        RAISE NOTICE 'Permissions forced for user %', v_user_id;
    ELSE
        RAISE NOTICE 'User presupuestaloficial@gmail.com not found in auth.users';
    END IF;
END $$;
