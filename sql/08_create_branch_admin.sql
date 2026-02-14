-- ============================================================
-- Create a Branch Admin User for an Existing Branch
-- ============================================================
-- Run this in the Supabase SQL Editor.
-- Replace the values below with your actual branch details.

-- Step 1: Create the auth user
-- (Supabase handles password hashing via auth.users insert helper)
-- We use the supabase_auth_admin role to insert into auth.users

-- First, find your branch ID:
SELECT id, name, city FROM branches;

-- Step 2: Create the auth user for Lodhran branch
-- Replace 'YOUR_BRANCH_ID' with the actual UUID from Step 1
-- Replace email/password as needed

DO $$
DECLARE
  v_branch_id UUID;
  v_user_id UUID;
BEGIN
  -- Get the Lodhran branch ID
  SELECT id INTO v_branch_id FROM branches WHERE name ILIKE '%lodhran%' LIMIT 1;
  
  IF v_branch_id IS NULL THEN
    RAISE EXCEPTION 'Lodhran branch not found. Check the branches table.';
  END IF;

  -- Create the auth user using Supabase's built-in function
  v_user_id := gen_random_uuid();
  
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    role,
    aud,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change_token_current,
    reauthentication_token,
    email_change,
    phone_change,
    phone_change_token,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    'lodhran@sheriffsecurity.com',                    -- Change email if needed
    crypt('Lodhran@2026', gen_salt('bf')),            -- Change password if needed
    NOW(),                                             -- Confirms email immediately
    jsonb_build_object('role', 'branch_admin', 'full_name', 'Lodhran Branch Admin'),
    'authenticated',
    'authenticated',
    '', '', '', '', '', '', '', '',                    -- Empty string tokens (prevents GoTrue NULL scan error)
    NOW(),
    NOW()
  );

  -- The handle_new_user trigger will auto-create the profile with role='branch_admin'
  -- Now link the profile to the Lodhran branch
  UPDATE profiles 
  SET branch_id = v_branch_id 
  WHERE id = v_user_id;

  RAISE NOTICE 'Branch admin created successfully!';
  RAISE NOTICE 'Email: lodhran@sheriffsecurity.com';
  RAISE NOTICE 'Password: Lodhran@2026';
  RAISE NOTICE 'Branch ID: %', v_branch_id;
  RAISE NOTICE 'User ID: %', v_user_id;
END $$;

-- Verify: Check the user was created
SELECT u.id, u.email, p.role, p.branch_id, b.name as branch_name
FROM auth.users u
JOIN profiles p ON p.id = u.id
LEFT JOIN branches b ON b.id = p.branch_id
WHERE u.email = 'lodhran@sheriffsecurity.com';
