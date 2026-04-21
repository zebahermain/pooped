-- Rework: allow guest (unauthenticated) splat sends.
--
-- This migration is idempotent — it bootstraps the public.splats table
-- from scratch if it doesn't exist yet, otherwise it only applies the
-- diff needed for guest sends (nullable sender_id + new INSERT policy).
--
-- Changes:
--   1. Ensure the splats table exists (with sender_id already nullable).
--   2. Make sender_id nullable if the table already existed.
--   3. Drop the old authenticated-only INSERT policy and replace it with a
--      hybrid policy that allows anon inserts where sender_id IS NULL while
--      still constraining authenticated users to own their rows.
--   4. Ensure the public SELECT policy + delete-own policy are in place.
--   5. Add indexes used by the feed + the "splats launched today" counter.

-- 1. Create the table if it doesn't exist (guest-ready schema from day one).
CREATE TABLE IF NOT EXISTS public.splats (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id uuid NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_name text NOT NULL DEFAULT '',
  sender_avatar text NOT NULL DEFAULT '💩',
  recipient_name text NOT NULL,
  units integer NOT NULL CHECK (units > 0),
  style text NOT NULL CHECK (style IN ('stealth','cannon','gentle','monsoon')),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 2. If the table existed with NOT NULL sender_id, relax that constraint.
ALTER TABLE public.splats
  ALTER COLUMN sender_id DROP NOT NULL;

-- 3. Row-level security on, then rebuild the policies idempotently.
ALTER TABLE public.splats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Splats are publicly readable" ON public.splats;
CREATE POLICY "Splats are publicly readable"
  ON public.splats
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create their own splats" ON public.splats;
DROP POLICY IF EXISTS "Anyone can create a splat (guest or authenticated)" ON public.splats;
CREATE POLICY "Anyone can create a splat (guest or authenticated)"
  ON public.splats
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    -- Guests: must leave sender_id null.
    (auth.uid() IS NULL AND sender_id IS NULL)
    -- Authenticated users: must own the row.
    OR (auth.uid() IS NOT NULL AND auth.uid() = sender_id)
  );

DROP POLICY IF EXISTS "Senders can delete their own splats" ON public.splats;
CREATE POLICY "Senders can delete their own splats"
  ON public.splats
  FOR DELETE
  TO authenticated
  USING (auth.uid() = sender_id);

-- 4. Indexes (no-op if already present from a prior migration).
CREATE INDEX IF NOT EXISTS idx_splats_sender ON public.splats(sender_id);
CREATE INDEX IF NOT EXISTS idx_splats_created ON public.splats(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_splats_created_day ON public.splats(created_at);
