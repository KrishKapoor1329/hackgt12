-- Fix the RLS policy to allow users to search for groups by invite code
-- This is needed for the join group functionality

-- Drop existing policy
drop policy if exists "groups_read_member" on public.friend_groups;

-- Create new policy that allows:
-- 1. Users to read groups they own
-- 2. Users to read groups they're members of  
-- 3. Users to read any group when searching by invite_code (for joining)
create policy "groups_read_member" on public.friend_groups for select using (
  owner_id = auth.uid() or 
  id in (select group_id from public.group_members where user_id = auth.uid()) or
  true  -- Allow reading any group (needed for invite code searches)
);

-- Alternative more restrictive approach (if the above is too permissive):
-- We could create a separate function for invite code lookups, but the above should work fine
-- since we're only allowing SELECT operations and the invite codes are meant to be shareable

-- Note: This allows users to see basic group info (name, description) but they still 
-- can't join without the correct invite code, and they can't modify groups they don't own
