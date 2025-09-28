-- Update krishkapoor1329 (High performer with good consistency)
UPDATE "public"."profiles"
SET win_rate = 72.5,
    total_winnings = 3450,
    total_picks = 40,
    correct_picks = 29,
    current_streak = 4,
    best_streak = 6
WHERE username = 'krishkapoor1329';

-- Update krishreaper (Above average performer)
UPDATE "public"."profiles"
SET win_rate = 68.4,
    total_winnings = 2850,
    total_picks = 38,
    correct_picks = 26,
    current_streak = 3,
    best_streak = 5
WHERE username = 'krishreaper';

-- Update nagrawal66 (Having a rough time, in the loss)
UPDATE "public"."profiles"
SET win_rate = 45.8,
    total_winnings = -750,
    total_picks = 24,
    correct_picks = 11,
    current_streak = 0,
    best_streak = 2
WHERE username = 'nagrawal66';

-- Update krishfirebreak (Top performer with highest winnings)
UPDATE "public"."profiles"
SET win_rate = 82.1,
    total_winnings = 5280,
    total_picks = 28,
    correct_picks = 23,
    current_streak = 6,
    best_streak = 6
WHERE username = 'krishfirebreak';

-- Update arthtakk (Average performer, slightly positive)
UPDATE "public"."profiles"
SET win_rate = 51.6,
    total_winnings = 180,
    total_picks = 31,
    correct_picks = 16,
    current_streak = 1,
    best_streak = 3
WHERE username = 'arthtakk';
