-- Fix existing user roles properly

-- Ensure rajeshksd1297@gmail.com has admin role
DO $$
DECLARE
    rajesh_user_id uuid;
BEGIN
    -- Get the user ID for rajeshksd1297@gmail.com
    SELECT id INTO rajesh_user_id FROM profiles WHERE email = 'rajeshksd1297@gmail.com' LIMIT 1;
    
    IF rajesh_user_id IS NOT NULL THEN
        -- Delete any existing roles for this user
        DELETE FROM user_roles WHERE user_id = rajesh_user_id;
        
        -- Insert admin role
        INSERT INTO user_roles (user_id, role) 
        VALUES (rajesh_user_id, 'admin');
        
        -- Update profile name if needed
        UPDATE profiles 
        SET full_name = 'Rajesh Admin', 
            updated_at = now()
        WHERE id = rajesh_user_id;
        
        RAISE NOTICE 'Admin role set for user %', rajesh_user_id;
    ELSE
        RAISE NOTICE 'User rajeshksd1297@gmail.com not found';
    END IF;
END $$;

-- Ensure user@demo.com keeps user role
DO $$
DECLARE
    demo_user_id uuid;
BEGIN
    -- Get the user ID for user@demo.com
    SELECT id INTO demo_user_id FROM profiles WHERE email = 'user@demo.com' LIMIT 1;
    
    IF demo_user_id IS NOT NULL THEN
        -- Delete any existing roles for this user
        DELETE FROM user_roles WHERE user_id = demo_user_id;
        
        -- Insert user role
        INSERT INTO user_roles (user_id, role) 
        VALUES (demo_user_id, 'user');
        
        RAISE NOTICE 'User role set for user %', demo_user_id;
    ELSE
        RAISE NOTICE 'User user@demo.com not found';
    END IF;
END $$;