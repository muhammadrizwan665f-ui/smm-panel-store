-- Check if the admin user has the role assigned
DO $$
DECLARE
    admin_uid UUID;
BEGIN
    SELECT id INTO admin_uid FROM auth.users WHERE email = '03154429417@mobile.panel';
    
    IF admin_uid IS NOT NULL THEN
        -- Upsert role just in case
        INSERT INTO public.user_roles (user_id, role)
        VALUES (admin_uid, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;
        
        RAISE NOTICE 'Admin role verified for user %', admin_uid;
    ELSE
        RAISE NOTICE 'Admin user not found by email';
    END IF;
END $$;
