-- =============================================================================
-- Sheriff Security — Make Super Admin
-- =============================================================================
-- Run this AFTER creating a user in Supabase Auth Dashboard:
--   1. Go to Authentication > Users > Add user
--   2. Enter email and password
--   3. Copy the user's UUID
--   4. Replace 'YOUR_USER_UUID_HERE' below
--   5. Run this SQL
-- =============================================================================

UPDATE profiles
SET role       = 'super_admin',
    full_name  = 'Admin User',
    branch_id  = NULL
WHERE id = 'YOUR_USER_UUID_HERE';

-- Verify
SELECT id, role, full_name, branch_id FROM profiles WHERE role = 'super_admin';
