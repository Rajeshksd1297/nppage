-- Fix user roles and clean up duplicates (corrected)

-- First, let's clean up duplicate roles manually
WITH duplicates AS (
    SELECT user_id, role, array_agg(id ORDER BY created_at) as ids
    FROM user_roles 
    GROUP BY user_id, role 
    HAVING count(*) > 1
)
DELETE FROM user_roles 
WHERE id IN (
    SELECT unnest(ids[2:]) 
    FROM duplicates
);

-- Ensure admin@demo.com has admin role
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Get the user ID for admin@demo.com
    SELECT id INTO admin_user_id FROM profiles WHERE email = 'admin@demo.com' LIMIT 1;
    
    IF admin_user_id IS NOT NULL THEN
        -- Delete any existing roles for this user
        DELETE FROM user_roles WHERE user_id = admin_user_id;
        
        -- Insert admin role
        INSERT INTO user_roles (user_id, role) 
        VALUES (admin_user_id, 'admin');
    END IF;
END $$;

-- Fix rajeshksd1297@gmail.com - ensure only one entry with admin role
DO $$
DECLARE
    rajesh_user_id uuid;
BEGIN
    -- Get the first user ID for rajeshksd1297@gmail.com
    SELECT id INTO rajesh_user_id FROM profiles WHERE email = 'rajeshksd1297@gmail.com' LIMIT 1;
    
    IF rajesh_user_id IS NOT NULL THEN
        -- Delete any existing roles for this user
        DELETE FROM user_roles WHERE user_id = rajesh_user_id;
        
        -- Insert admin role
        INSERT INTO user_roles (user_id, role) 
        VALUES (rajesh_user_id, 'admin');
    END IF;
END $$;

-- Remove duplicate profiles for rajeshksd1297@gmail.com
DO $$
DECLARE
    keep_profile_id uuid;
BEGIN
    -- Keep the first profile and delete others
    SELECT id INTO keep_profile_id 
    FROM profiles 
    WHERE email = 'rajeshksd1297@gmail.com' 
    ORDER BY created_at 
    LIMIT 1;
    
    -- Delete other profiles with same email
    DELETE FROM profiles 
    WHERE email = 'rajeshksd1297@gmail.com' 
    AND id != keep_profile_id;
END $$;

-- Enable real-time for user management tables
ALTER TABLE profiles REPLICA IDENTITY FULL;
ALTER TABLE user_roles REPLICA IDENTITY FULL;

-- Add tables to realtime publication
DO $$
BEGIN
    -- Add profiles to realtime
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
    EXCEPTION WHEN duplicate_object THEN
        -- Table already added to publication
    END;
    
    -- Add user_roles to realtime
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE user_roles;
    EXCEPTION WHEN duplicate_object THEN
        -- Table already added to publication
    END;
END $$;