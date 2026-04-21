-- Rework: allow guest (unauthenticated) splat sends.
--
-- Changes:
--   1. sender_id becomes nullable so anon users can insert rows without a user id.
--   2. The INSERT policy is broadened to allow anon inserts where sender_id is NULL,
--      while still constraining authenticated users to own their splats.
--   3. Add an index on created_at for the "splats launched today" live counter.

-- 1. Make sender_id nullable
ALTER TABLE public.splats
  ALTER COLUMN sender_id DROP NOT NULL;

-- 2. Replace the old authenticated-only INSERT policy with a hybrid policy
DROP POLICY IF EXISTS "Authenticated users can create their own splats" ON public.splats;

CREATE POLICY "Anyone can create a splat (guest or authenticated)"
  ON public.splats
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    -- Guests must leave sender_id null.
    (auth.uid() IS NULL AND sender_id IS NULL)
    -- Authenticated users must own the row.
    OR (auth.uid() IS NOT NULL AND auth.uid() = sender_id)
  );

-- 3. Index used by the "splats launched today" counter on /splat/[id]
CREATE INDEX IF NOT EXISTS idx_splats_created_day ON public.splats(created_at);
