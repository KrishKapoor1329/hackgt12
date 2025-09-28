-- Watch Party Features Migration
-- Run this after the main supabase_schema.sql

-- =============================================================================
-- WATCH PARTY TABLES
-- =============================================================================

-- Main watch parties table
CREATE TABLE IF NOT EXISTS public.watch_parties (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  image_url text,
  host_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  game_title text NOT NULL,
  game_time timestamp with time zone NOT NULL,
  game_data jsonb, -- Store match details, teams, etc.
  attendee_count integer DEFAULT 1, -- Start with host
  location_latitude numeric,
  location_longitude numeric,
  location_address text,
  city text,
  state text,
  country text DEFAULT 'US',
  status text DEFAULT 'active' CHECK (status IN ('active', 'ended', 'cancelled')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Watch party members/attendees
CREATE TABLE IF NOT EXISTS public.watch_party_members (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  watch_party_id uuid NOT NULL REFERENCES public.watch_parties(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_preference text, -- 'eagles', 'chiefs', 'neutral'
  team_data jsonb, -- Store full team selection data
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  joined_at timestamp with time zone DEFAULT now(),
  UNIQUE(watch_party_id, user_id)
);

-- Live reactions in watch parties
CREATE TABLE IF NOT EXISTS public.watch_party_reactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  watch_party_id uuid NOT NULL REFERENCES public.watch_parties(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type text NOT NULL, -- 'emoji', 'text', 'voice'
  emoji text,
  text_content text,
  intensity text DEFAULT 'medium' CHECK (intensity IN ('low', 'medium', 'high')),
  created_at timestamp with time zone DEFAULT now()
);

-- Live betting within watch parties
CREATE TABLE IF NOT EXISTS public.watch_party_bets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  watch_party_id uuid NOT NULL REFERENCES public.watch_parties(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bet_option text NOT NULL,
  odds text,
  stake_amount numeric NOT NULL,
  potential_payout text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost', 'void')),
  placed_at timestamp with time zone DEFAULT now(),
  resolved_at timestamp with time zone
);

-- Play-by-play analysis for watch parties
CREATE TABLE IF NOT EXISTS public.play_by_play (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  watch_party_id uuid NOT NULL REFERENCES public.watch_parties(id) ON DELETE CASCADE,
  quarter text NOT NULL,
  game_time text NOT NULL,
  play_description text NOT NULL,
  ai_analysis text,
  impact_level text DEFAULT 'medium' CHECK (impact_level IN ('low', 'medium', 'high')),
  created_at timestamp with time zone DEFAULT now()
);

-- =============================================================================
-- EXTEND EXISTING TABLES
-- =============================================================================

-- Add watch party related fields to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_team text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS watch_parties_hosted integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS watch_parties_joined integer DEFAULT 0;

-- Extend bets table for watch party context
ALTER TABLE public.bets ADD COLUMN IF NOT EXISTS watch_party_id uuid REFERENCES public.watch_parties(id) ON DELETE SET NULL;
ALTER TABLE public.bets ADD COLUMN IF NOT EXISTS bet_type text DEFAULT 'individual' CHECK (bet_type IN ('individual', 'watch_party'));

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_watch_parties_host ON public.watch_parties (host_id);
CREATE INDEX IF NOT EXISTS idx_watch_parties_location ON public.watch_parties (city, state, country);
CREATE INDEX IF NOT EXISTS idx_watch_parties_game_time ON public.watch_parties (game_time);
CREATE INDEX IF NOT EXISTS idx_watch_parties_status ON public.watch_parties (status);

CREATE INDEX IF NOT EXISTS idx_watch_party_members_party ON public.watch_party_members (watch_party_id);
CREATE INDEX IF NOT EXISTS idx_watch_party_members_user ON public.watch_party_members (user_id);
CREATE INDEX IF NOT EXISTS idx_watch_party_members_team ON public.watch_party_members (team_preference);

CREATE INDEX IF NOT EXISTS idx_watch_party_reactions_party ON public.watch_party_reactions (watch_party_id);
CREATE INDEX IF NOT EXISTS idx_watch_party_reactions_user ON public.watch_party_reactions (user_id);
CREATE INDEX IF NOT EXISTS idx_watch_party_reactions_time ON public.watch_party_reactions (created_at);

CREATE INDEX IF NOT EXISTS idx_watch_party_bets_party ON public.watch_party_bets (watch_party_id);
CREATE INDEX IF NOT EXISTS idx_watch_party_bets_user ON public.watch_party_bets (user_id);
CREATE INDEX IF NOT EXISTS idx_watch_party_bets_status ON public.watch_party_bets (status);

CREATE INDEX IF NOT EXISTS idx_play_by_play_party ON public.play_by_play (watch_party_id);
CREATE INDEX IF NOT EXISTS idx_play_by_play_time ON public.play_by_play (created_at);

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Enable RLS on all new tables
ALTER TABLE public.watch_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_party_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_party_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_party_bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.play_by_play ENABLE ROW LEVEL SECURITY;

-- Watch Parties Policies
DROP POLICY IF EXISTS "watch_parties_read_public" ON public.watch_parties;
DROP POLICY IF EXISTS "watch_parties_read_private" ON public.watch_parties;
DROP POLICY IF EXISTS "watch_parties_create_own" ON public.watch_parties;
DROP POLICY IF EXISTS "watch_parties_update_own" ON public.watch_parties;

-- Make all watch parties public (readable by any authenticated user)
CREATE POLICY "watch_parties_read_public" ON public.watch_parties 
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only host can create and manage their watch parties
CREATE POLICY "watch_parties_create_own" ON public.watch_parties 
FOR INSERT WITH CHECK (host_id = auth.uid());

CREATE POLICY "watch_parties_update_own" ON public.watch_parties 
FOR UPDATE USING (host_id = auth.uid());

-- Watch Party Members Policies
DROP POLICY IF EXISTS "watch_party_members_read_member" ON public.watch_party_members;
DROP POLICY IF EXISTS "watch_party_members_join" ON public.watch_party_members;
DROP POLICY IF EXISTS "watch_party_members_leave" ON public.watch_party_members;

CREATE POLICY "watch_party_members_read_member" ON public.watch_party_members 
FOR SELECT USING (
  user_id = auth.uid() OR
  watch_party_id IN (
    SELECT wp.id FROM public.watch_parties wp 
    WHERE wp.host_id = auth.uid()
  )
);

CREATE POLICY "watch_party_members_join" ON public.watch_party_members 
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "watch_party_members_leave" ON public.watch_party_members 
FOR DELETE USING (user_id = auth.uid());

-- Watch Party Reactions Policies
DROP POLICY IF EXISTS "watch_party_reactions_read_member" ON public.watch_party_reactions;
DROP POLICY IF EXISTS "watch_party_reactions_create_member" ON public.watch_party_reactions;

CREATE POLICY "watch_party_reactions_read_member" ON public.watch_party_reactions 
FOR SELECT USING (
  watch_party_id IN (
    SELECT wp.id FROM public.watch_parties wp 
    JOIN public.watch_party_members wpm ON wp.id = wpm.watch_party_id 
    WHERE wpm.user_id = auth.uid() OR wp.host_id = auth.uid()
  )
);

CREATE POLICY "watch_party_reactions_create_member" ON public.watch_party_reactions 
FOR INSERT WITH CHECK (
  user_id = auth.uid() AND
  watch_party_id IN (
    SELECT wp.id FROM public.watch_parties wp 
    JOIN public.watch_party_members wpm ON wp.id = wpm.watch_party_id 
    WHERE wpm.user_id = auth.uid() OR wp.host_id = auth.uid()
  )
);

-- Watch Party Bets Policies
DROP POLICY IF EXISTS "watch_party_bets_read_member" ON public.watch_party_bets;
DROP POLICY IF EXISTS "watch_party_bets_create_own" ON public.watch_party_bets;

CREATE POLICY "watch_party_bets_read_member" ON public.watch_party_bets 
FOR SELECT USING (
  watch_party_id IN (
    SELECT wp.id FROM public.watch_parties wp 
    JOIN public.watch_party_members wpm ON wp.id = wpm.watch_party_id 
    WHERE wpm.user_id = auth.uid() OR wp.host_id = auth.uid()
  )
);

CREATE POLICY "watch_party_bets_create_own" ON public.watch_party_bets 
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Play-by-Play Policies
DROP POLICY IF EXISTS "play_by_play_read_member" ON public.play_by_play;
DROP POLICY IF EXISTS "play_by_play_create_system" ON public.play_by_play;

CREATE POLICY "play_by_play_read_member" ON public.play_by_play 
FOR SELECT USING (
  watch_party_id IN (
    SELECT wp.id FROM public.watch_parties wp 
    JOIN public.watch_party_members wpm ON wp.id = wpm.watch_party_id 
    WHERE wpm.user_id = auth.uid() OR wp.host_id = auth.uid()
  )
);

-- For now, allow any authenticated user to create play-by-play (for demo)
-- In production, this would be restricted to system/admin users
CREATE POLICY "play_by_play_create_system" ON public.play_by_play 
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Ensure attendee_count reflects only approved members

-- Function to update attendee count when members join/leave
CREATE OR REPLACE FUNCTION public.update_watch_party_attendee_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'approved' THEN
      UPDATE public.watch_parties 
      SET attendee_count = attendee_count + 1,
          updated_at = now()
      WHERE id = NEW.watch_party_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF (OLD.status IS DISTINCT FROM 'approved') AND NEW.status = 'approved' THEN
      UPDATE public.watch_parties 
      SET attendee_count = attendee_count + 1,
          updated_at = now()
      WHERE id = NEW.watch_party_id;
    ELSIF OLD.status = 'approved' AND (NEW.status IS DISTINCT FROM 'approved') THEN
      UPDATE public.watch_parties 
      SET attendee_count = GREATEST(1, attendee_count - 1),
          updated_at = now()
      WHERE id = NEW.watch_party_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.status = 'approved' THEN
      UPDATE public.watch_parties 
      SET attendee_count = GREATEST(1, attendee_count - 1),
          updated_at = now()
      WHERE id = OLD.watch_party_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers for attendee count
DROP TRIGGER IF EXISTS trigger_watch_party_member_added ON public.watch_party_members;
DROP TRIGGER IF EXISTS trigger_watch_party_member_removed ON public.watch_party_members;
DROP TRIGGER IF EXISTS trigger_watch_party_member_updated ON public.watch_party_members;

CREATE TRIGGER trigger_watch_party_member_added
  AFTER INSERT ON public.watch_party_members
  FOR EACH ROW EXECUTE FUNCTION public.update_watch_party_attendee_count();

CREATE TRIGGER trigger_watch_party_member_updated
  AFTER UPDATE ON public.watch_party_members
  FOR EACH ROW EXECUTE FUNCTION public.update_watch_party_attendee_count();

CREATE TRIGGER trigger_watch_party_member_removed
  AFTER DELETE ON public.watch_party_members
  FOR EACH ROW EXECUTE FUNCTION public.update_watch_party_attendee_count();

-- Function to auto-add host as first member when creating watch party
CREATE OR REPLACE FUNCTION public.add_host_as_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.watch_party_members (watch_party_id, user_id, team_preference, status)
  VALUES (NEW.id, NEW.host_id, 'neutral', 'approved')
  ON CONFLICT (watch_party_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Make all existing parties public and normalize flags
-- UPDATE public.watch_parties SET is_private = false WHERE is_private IS DISTINCT FROM false;

DROP TRIGGER IF EXISTS trigger_add_host_as_member ON public.watch_parties;
CREATE TRIGGER trigger_add_host_as_member
  AFTER INSERT ON public.watch_parties
  FOR EACH ROW EXECUTE FUNCTION public.add_host_as_member();

-- =============================================================================
-- SAMPLE DATA FOR DEMO
-- =============================================================================

-- Insert sample Super Bowl watch party (only if none exists)
INSERT INTO public.watch_parties (
  id,
  name,
  description,
  host_id,
  game_title,
  game_time,
  game_data,
  location_latitude,
  location_longitude,
  location_address,
  city,
  state,
  country
) 
SELECT 
  '11111111-1111-1111-1111-111111111111'::uuid,
  'Super Bowl LVIII Watch Party',
  'Come watch the Eagles vs Chiefs showdown! Snacks and drinks provided!',
  (SELECT id FROM auth.users LIMIT 1),
  'Super Bowl LVIII',
  '2024-02-11 18:30:00-05'::timestamp with time zone,
  '{"teams": {"home": {"name": "Kansas City Chiefs", "shortName": "KC", "color": "#E31837"}, "away": {"name": "Philadelphia Eagles", "shortName": "PHI", "color": "#004C54"}}, "location": "Las Vegas, NV"}'::jsonb,
  33.7490,
  -84.3880,
  'Downtown Atlanta',
  'Atlanta',
  'GA',
  'US'
WHERE NOT EXISTS (SELECT 1 FROM public.watch_parties WHERE id = '11111111-1111-1111-1111-111111111111'::uuid);

-- Insert sample play-by-play data
INSERT INTO public.play_by_play (
  watch_party_id,
  quarter,
  game_time,
  play_description,
  ai_analysis,
  impact_level
) 
SELECT 
  '11111111-1111-1111-1111-111111111111'::uuid,
  'Q4',
  '14:32',
  'Mahomes pass to Kelce for 12 yards',
  'Key conversion on 3rd and 8. Chiefs showing championship composure under pressure.',
  'high'
WHERE EXISTS (SELECT 1 FROM public.watch_parties WHERE id = '11111111-1111-1111-1111-111111111111'::uuid);

-- =============================================================================
-- MATERIALIZED VIEWS FOR ANALYTICS
-- =============================================================================

-- Watch party stats view
DROP MATERIALIZED VIEW IF EXISTS public.watch_party_stats;
CREATE MATERIALIZED VIEW public.watch_party_stats AS
SELECT 
  wp.id,
  wp.name,
  wp.host_id,
  wp.attendee_count,
  COUNT(DISTINCT wpr.id) as reaction_count,
  COUNT(DISTINCT wpb.id) as bet_count,
  SUM(wpb.stake_amount) as total_bet_volume,
  COUNT(DISTINCT CASE WHEN wpb.status = 'won' THEN wpb.id END) as bets_won,
  COUNT(DISTINCT CASE WHEN wpb.status = 'lost' THEN wpb.id END) as bets_lost,
  wp.created_at
FROM public.watch_parties wp
LEFT JOIN public.watch_party_reactions wpr ON wp.id = wpr.watch_party_id
LEFT JOIN public.watch_party_bets wpb ON wp.id = wpb.watch_party_id
GROUP BY wp.id, wp.name, wp.host_id, wp.attendee_count, wp.created_at;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_watch_party_stats_host ON public.watch_party_stats (host_id);

-- Function to refresh stats
CREATE OR REPLACE FUNCTION public.refresh_watch_party_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW public.watch_party_stats;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- FINAL NOTES
-- =============================================================================

-- To refresh the watch party stats manually:
-- SELECT public.refresh_watch_party_stats();

-- To get watch parties near a location:
-- SELECT * FROM public.watch_parties 
-- WHERE city = 'Atlanta' AND status = 'active'
-- ORDER BY created_at DESC;

-- To get watch party betting activity:
-- SELECT wpb.*, p.username 
-- FROM public.watch_party_bets wpb
-- JOIN public.profiles p ON wpb.user_id = p.id
-- WHERE wpb.watch_party_id = 'your-watch-party-id'
-- ORDER BY wpb.placed_at DESC;
