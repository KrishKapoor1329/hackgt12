-- Debug script to test the invite code issue
-- Run this in Supabase SQL Editor to diagnose the problem

-- 1. Check if the group exists
SELECT 'Group exists check:' as test;
SELECT id, name, invite_code, is_private, owner_id, created_at 
FROM public.friend_groups 
WHERE invite_code = '4AF615D4';

-- 2. Check if RLS is blocking the query
SELECT 'RLS policy check:' as test;
SELECT current_user, auth.uid();

-- 3. Check what policies exist
SELECT 'Current policies:' as test;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'friend_groups';

-- 4. Test the exact query the app uses (as authenticated user)
SELECT 'App query simulation:' as test;
SELECT id, name, description, owner_id, invite_code, is_private
FROM public.friend_groups 
WHERE invite_code = '4AF615D4';

-- 5. Check all groups to see what's visible
SELECT 'All visible groups:' as test;
SELECT id, name, invite_code, is_private, owner_id
FROM public.friend_groups 
ORDER BY created_at DESC
LIMIT 10;

-- 6. Check if case sensitivity is an issue
SELECT 'Case sensitivity test:' as test;
SELECT id, name, invite_code, is_private
FROM public.friend_groups 
WHERE upper(invite_code) = '4AF615D4'
   OR lower(invite_code) = '4af615d4'
   OR invite_code = '4af615d4';
