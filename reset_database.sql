-- Database Reset Script
-- This will completely reset the watch party database

-- Drop all watch party related tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS public.play_by_play CASCADE;
DROP TABLE IF EXISTS public.watch_party_bets CASCADE;
DROP TABLE IF EXISTS public.watch_party_reactions CASCADE;
DROP TABLE IF EXISTS public.watch_party_members CASCADE;
DROP TABLE IF EXISTS public.watch_parties CASCADE;

-- Drop materialized view
DROP MATERIALIZED VIEW IF EXISTS public.watch_party_stats CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS public.update_watch_party_attendee_count() CASCADE;
DROP FUNCTION IF EXISTS public.add_host_as_member() CASCADE;
DROP FUNCTION IF EXISTS public.refresh_watch_party_stats() CASCADE;

-- Drop triggers (they should be dropped with the functions, but just to be safe)
DROP TRIGGER IF EXISTS trigger_watch_party_member_added ON public.watch_party_members;
DROP TRIGGER IF EXISTS trigger_watch_party_member_removed ON public.watch_party_members;
DROP TRIGGER IF EXISTS trigger_watch_party_member_updated ON public.watch_party_members;
DROP TRIGGER IF EXISTS trigger_add_host_as_member ON public.watch_parties;

-- Now run the migration to recreate everything
-- You should run: \i watch_party_migration.sql after running this script
