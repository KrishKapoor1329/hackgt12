-- NFL Team Migration SQL
-- Run this in your Supabase SQL editor to add NFL team support

-- Add favorite_nfl_team column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS favorite_nfl_team text;

-- Create index for better performance when querying by team
CREATE INDEX IF NOT EXISTS idx_profiles_favorite_nfl_team ON public.profiles (favorite_nfl_team);

-- Add some sample team assignments (optional - remove if you don't want test data)
-- UPDATE public.profiles SET favorite_nfl_team = 'KC' WHERE username LIKE '%chief%' OR username LIKE '%kc%';
-- UPDATE public.profiles SET favorite_nfl_team = 'SF' WHERE username LIKE '%49%' OR username LIKE '%niners%';
-- UPDATE public.profiles SET favorite_nfl_team = 'DAL' WHERE username LIKE '%cowboys%' OR username LIKE '%dal%';

-- Verify the migration
SELECT 
  COUNT(*) as total_users,
  COUNT(favorite_nfl_team) as users_with_teams,
  favorite_nfl_team,
  COUNT(*) as team_count
FROM public.profiles 
GROUP BY favorite_nfl_team
ORDER BY team_count DESC;
