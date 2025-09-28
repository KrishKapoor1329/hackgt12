-- Reset Watch Party Database for Philly vs Kansas Game Only
-- This script completely resets the watch party feature for hackathon demo

-- =============================================================================
-- DROP EXISTING WATCH PARTY TABLES
-- =============================================================================

-- Drop all watch party related tables and their dependencies
DROP TABLE IF EXISTS public.play_by_play CASCADE;
DROP TABLE IF EXISTS public.watch_party_bets CASCADE;
DROP TABLE IF EXISTS public.watch_party_reactions CASCADE;
DROP TABLE IF EXISTS public.watch_party_members CASCADE;
DROP TABLE IF EXISTS public.watch_parties CASCADE;

-- Drop materialized views
DROP MATERIALIZED VIEW IF EXISTS public.watch_party_stats CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS public.update_watch_party_attendee_count() CASCADE;
DROP FUNCTION IF EXISTS public.add_host_as_member() CASCADE;
DROP FUNCTION IF EXISTS public.refresh_watch_party_stats() CASCADE;

-- =============================================================================
-- CREATE NEW SIMPLIFIED WATCH PARTY TABLES
-- =============================================================================

-- Main watch parties table (simplified for Philly vs Kansas only)
CREATE TABLE IF NOT EXISTS public.watch_parties (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  host_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  game_title text NOT NULL DEFAULT 'Philadelphia Eagles vs Kansas City Chiefs',
  game_time timestamp with time zone NOT NULL DEFAULT '2024-02-11 18:30:00-05'::timestamp with time zone,
  attendee_count integer DEFAULT 1, -- Start with host
  status text DEFAULT 'active' CHECK (status IN ('active', 'ended', 'cancelled')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Watch party members with team preference (no actual location tracking)
CREATE TABLE IF NOT EXISTS public.watch_party_members (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  watch_party_id uuid NOT NULL REFERENCES public.watch_parties(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_preference text CHECK (team_preference IN ('phi', 'kc', 'neutral')), -- Philadelphia Eagles, Kansas City Chiefs, or neutral
  team_data jsonb, -- Store full team selection data (name, colors, etc.)
  status text DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  joined_at timestamp with time zone DEFAULT now(),
  UNIQUE(watch_party_id, user_id)
);

-- Watch party bets table
CREATE TABLE IF NOT EXISTS public.watch_party_bets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  watch_party_id uuid NOT NULL REFERENCES public.watch_parties(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bet_type text NOT NULL, -- 'next_touchdown', 'final_score', 'total_points', 'first_down', etc.
  bet_description text NOT NULL, -- Human readable description
  bet_option text NOT NULL, -- The specific choice made
  odds numeric NOT NULL DEFAULT 2.0, -- Betting odds (e.g., 2.0 = 2:1)
  stake_amount numeric NOT NULL, -- Amount bet
  potential_payout numeric NOT NULL, -- Calculated payout if won
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost', 'void')),
  outcome_determined boolean DEFAULT false,
  actual_outcome text, -- What actually happened
  placed_at timestamp with time zone DEFAULT now(),
  resolved_at timestamp with time zone
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_watch_parties_host ON public.watch_parties (host_id);
CREATE INDEX IF NOT EXISTS idx_watch_parties_game_time ON public.watch_parties (game_time);
CREATE INDEX IF NOT EXISTS idx_watch_parties_status ON public.watch_parties (status);

CREATE INDEX IF NOT EXISTS idx_watch_party_members_party ON public.watch_party_members (watch_party_id);
CREATE INDEX IF NOT EXISTS idx_watch_party_members_user ON public.watch_party_members (user_id);
CREATE INDEX IF NOT EXISTS idx_watch_party_members_team ON public.watch_party_members (team_preference);

CREATE INDEX IF NOT EXISTS idx_watch_party_bets_party ON public.watch_party_bets (watch_party_id);
CREATE INDEX IF NOT EXISTS idx_watch_party_bets_user ON public.watch_party_bets (user_id);
CREATE INDEX IF NOT EXISTS idx_watch_party_bets_status ON public.watch_party_bets (status);
CREATE INDEX IF NOT EXISTS idx_watch_party_bets_placed_at ON public.watch_party_bets (placed_at);

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.watch_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_party_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_party_bets ENABLE ROW LEVEL SECURITY;

-- Watch Parties Policies - All authenticated users can read all watch parties
DROP POLICY IF EXISTS "watch_parties_read_public" ON public.watch_parties;
DROP POLICY IF EXISTS "watch_parties_create_own" ON public.watch_parties;
DROP POLICY IF EXISTS "watch_parties_update_own" ON public.watch_parties;

CREATE POLICY "watch_parties_read_public" ON public.watch_parties 
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "watch_parties_create_own" ON public.watch_parties 
FOR INSERT WITH CHECK (host_id = auth.uid());

CREATE POLICY "watch_parties_update_own" ON public.watch_parties 
FOR UPDATE USING (host_id = auth.uid());

-- Watch Party Members Policies
DROP POLICY IF EXISTS "watch_party_members_read_all" ON public.watch_party_members;
DROP POLICY IF EXISTS "watch_party_members_join" ON public.watch_party_members;
DROP POLICY IF EXISTS "watch_party_members_leave" ON public.watch_party_members;

-- All authenticated users can read all members (for map display)
CREATE POLICY "watch_party_members_read_all" ON public.watch_party_members 
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "watch_party_members_join" ON public.watch_party_members 
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "watch_party_members_leave" ON public.watch_party_members 
FOR DELETE USING (user_id = auth.uid());

-- Watch Party Bets Policies
DROP POLICY IF EXISTS "watch_party_bets_read_all" ON public.watch_party_bets;
DROP POLICY IF EXISTS "watch_party_bets_create_own" ON public.watch_party_bets;
DROP POLICY IF EXISTS "watch_party_bets_update_own" ON public.watch_party_bets;

-- All authenticated users can read all bets (for transparency)
CREATE POLICY "watch_party_bets_read_all" ON public.watch_party_bets 
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "watch_party_bets_create_own" ON public.watch_party_bets 
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "watch_party_bets_update_own" ON public.watch_party_bets 
FOR UPDATE USING (user_id = auth.uid());

-- =============================================================================
-- FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Function to increment attendee count when new members join (excluding host)
CREATE OR REPLACE FUNCTION public.update_watch_party_attendee_count()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only increment count if the new member is not the host
  IF NEW.user_id != (
    SELECT host_id 
    FROM public.watch_parties 
    WHERE id = NEW.watch_party_id
  ) THEN
    UPDATE public.watch_parties 
    SET attendee_count = attendee_count + 1,
        updated_at = now()
    WHERE id = NEW.watch_party_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-add host as first member when creating watch party
CREATE OR REPLACE FUNCTION public.add_host_as_member()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.watch_party_members (watch_party_id, user_id, team_preference, status)
  VALUES (NEW.id, NEW.host_id, 'neutral', 'approved')
  ON CONFLICT (watch_party_id, user_id) DO NOTHING;
  
  -- Ensure attendee_count is set to 1 for new watch parties
  UPDATE public.watch_parties 
  SET attendee_count = 1
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure owner is postgres so SECURITY DEFINER bypasses RLS
ALTER FUNCTION public.update_watch_party_attendee_count() OWNER TO postgres;
ALTER FUNCTION public.add_host_as_member() OWNER TO postgres;

-- Trigger for incrementing attendee count on new member join
DROP TRIGGER IF EXISTS trigger_watch_party_member_added ON public.watch_party_members;
DROP TRIGGER IF EXISTS trigger_watch_party_member_removed ON public.watch_party_members;
DROP TRIGGER IF EXISTS trigger_watch_party_member_updated ON public.watch_party_members;

CREATE TRIGGER trigger_watch_party_member_added
  AFTER INSERT ON public.watch_party_members
  FOR EACH ROW EXECUTE FUNCTION public.update_watch_party_attendee_count();

-- Trigger to auto-add host as member
DROP TRIGGER IF EXISTS trigger_add_host_as_member ON public.watch_parties;
CREATE TRIGGER trigger_add_host_as_member
  AFTER INSERT ON public.watch_parties
  FOR EACH ROW EXECUTE FUNCTION public.add_host_as_member();

-- =============================================================================
-- SAMPLE DATA FOR PHILLY VS KANSAS GAME
-- =============================================================================

-- Insert sample watch parties for the Philly vs Kansas game
INSERT INTO public.watch_parties (
  id,
  name,
  description,
  host_id,
  game_title,
  game_time
) 
SELECT 
  '11111111-1111-1111-1111-111111111111'::uuid,
  'Epic Eagles vs Chiefs Showdown!',
  'Come watch the ultimate battle between Philadelphia Eagles and Kansas City Chiefs! Snacks, drinks, and great company guaranteed!',
  (SELECT id FROM auth.users LIMIT 1),
  'Philadelphia Eagles vs Kansas City Chiefs',
  '2024-02-11 18:30:00-05'::timestamp with time zone
WHERE EXISTS (SELECT 1 FROM auth.users LIMIT 1)
AND NOT EXISTS (SELECT 1 FROM public.watch_parties WHERE id = '11111111-1111-1111-1111-111111111111'::uuid);

INSERT INTO public.watch_parties (
  id,
  name,
  description,
  host_id,
  game_title,
  game_time
) 
SELECT 
  '22222222-2222-2222-2222-222222222222'::uuid,
  'Chiefs Kingdom Watch Party',
  'Red Sea rising! Join fellow Chiefs fans for the big game. Mahomes magic awaits!',
  (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1 OFFSET 1),
  'Philadelphia Eagles vs Kansas City Chiefs',
  '2024-02-11 18:30:00-05'::timestamp with time zone
WHERE (SELECT COUNT(*) FROM auth.users) > 1
AND NOT EXISTS (SELECT 1 FROM public.watch_parties WHERE id = '22222222-2222-2222-2222-222222222222'::uuid);

INSERT INTO public.watch_parties (
  id,
  name,
  description,
  host_id,
  game_title,
  game_time
) 
SELECT 
  '33333333-3333-3333-3333-333333333333'::uuid,
  'Fly Eagles Fly Party!',
  'E-A-G-L-E-S EAGLES! Join the Bird Gang for an unforgettable watch party experience!',
  (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1),
  'Philadelphia Eagles vs Kansas City Chiefs',
  '2024-02-11 18:30:00-05'::timestamp with time zone
WHERE EXISTS (SELECT 1 FROM auth.users LIMIT 1)
AND NOT EXISTS (SELECT 1 FROM public.watch_parties WHERE id = '33333333-3333-3333-3333-333333333333'::uuid);

-- =============================================================================
-- SAMPLE BETTING DATA FOR DEMO
-- =============================================================================

-- Insert sample bets for the demo watch party (only if watch party exists)
INSERT INTO public.watch_party_bets (
  watch_party_id,
  user_id,
  bet_type,
  bet_description,
  bet_option,
  odds,
  stake_amount,
  potential_payout,
  status,
  outcome_determined,
  actual_outcome,
  placed_at,
  resolved_at
) 
SELECT 
  '11111111-1111-1111-1111-111111111111'::uuid,
  (SELECT id FROM auth.users LIMIT 1),
  'next_touchdown',
  'Who will score the next touchdown?',
  'Philadelphia Eagles',
  2.5,
  25.00,
  62.50,
  'won',
  true,
  'Philadelphia Eagles',
  now() - interval '15 minutes',
  now() - interval '10 minutes'
WHERE EXISTS (SELECT 1 FROM public.watch_parties WHERE id = '11111111-1111-1111-1111-111111111111'::uuid)
AND EXISTS (SELECT 1 FROM auth.users LIMIT 1);

INSERT INTO public.watch_party_bets (
  watch_party_id,
  user_id,
  bet_type,
  bet_description,
  bet_option,
  odds,
  stake_amount,
  potential_payout,
  status,
  outcome_determined,
  actual_outcome,
  placed_at,
  resolved_at
) 
SELECT 
  '11111111-1111-1111-1111-111111111111'::uuid,
  (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1 OFFSET 1),
  'total_points',
  'Will total points be over/under 45?',
  'Over 45',
  1.8,
  50.00,
  90.00,
  'lost',
  true,
  'Under 45 (Final: 42 points)',
  now() - interval '25 minutes',
  now() - interval '5 minutes'
WHERE EXISTS (SELECT 1 FROM public.watch_parties WHERE id = '11111111-1111-1111-1111-111111111111'::uuid)
AND (SELECT COUNT(*) FROM auth.users) > 1;

INSERT INTO public.watch_party_bets (
  watch_party_id,
  user_id,
  bet_type,
  bet_description,
  bet_option,
  odds,
  stake_amount,
  potential_payout,
  status,
  outcome_determined,
  actual_outcome,
  placed_at
) 
SELECT 
  '11111111-1111-1111-1111-111111111111'::uuid,
  (SELECT id FROM auth.users LIMIT 1),
  'first_down',
  'Who will get the next first down?',
  'Kansas City Chiefs',
  2.0,
  30.00,
  60.00,
  'pending',
  false,
  null,
  now() - interval '2 minutes'
WHERE EXISTS (SELECT 1 FROM public.watch_parties WHERE id = '11111111-1111-1111-1111-111111111111'::uuid)
AND EXISTS (SELECT 1 FROM auth.users LIMIT 1);

-- =============================================================================
-- NOTES
-- =============================================================================

-- This simplified schema focuses on:
-- 1. Only Philly vs Kansas game (no other games)
-- 2. Team preferences (phi, kc, neutral)
-- 3. Live betting with predetermined outcomes for demo
-- 4. No physical watch party locations - only user locations displayed on map
-- 5. Simplified structure for hackathon demo

-- To view all watch parties:
-- SELECT * FROM public.watch_parties;

-- To view all members with their team preferences:
-- SELECT wpm.*, p.username, wp.name as party_name 
-- FROM public.watch_party_members wpm
-- JOIN public.profiles p ON wpm.user_id = p.id
-- JOIN public.watch_parties wp ON wpm.watch_party_id = wp.id;

-- To view all bets with user info:
-- SELECT wpb.*, p.username, wp.name as party_name
-- FROM public.watch_party_bets wpb
-- JOIN public.profiles p ON wpb.user_id = p.id
-- JOIN public.watch_parties wp ON wpb.watch_party_id = wp.id
-- ORDER BY wpb.placed_at DESC;
