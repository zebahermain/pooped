-- M3 schema: Pro flag on profiles + monthly report cards table
--
-- Both additions are idempotent so this migration is safe to re-run
-- on an environment that has already received it (or on a Lovable-owned
-- Supabase that partially has it).

-- 1. profiles.is_pro (default false) — flips manually in the dashboard
--    while payments aren't built yet.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_pro boolean NOT NULL DEFAULT false;

-- 2. monthly_report_cards — one row per user per month.
CREATE TABLE IF NOT EXISTS public.monthly_report_cards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month date NOT NULL, -- first day of the reported month, e.g. 2026-03-01
  consistency_grade text NOT NULL,
  color_health_grade text NOT NULL,
  frequency_grade text NOT NULL,
  streak_grade text NOT NULL,
  overall_gpa numeric(3,2) NOT NULL,
  days_logged integer NOT NULL,
  days_in_month integer NOT NULL,
  average_gut_score numeric(5,2) NOT NULL,
  ai_comment text, -- nullable; only populated for Pro users once per month
  generated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT monthly_report_cards_user_month_uq UNIQUE (user_id, month)
);

CREATE INDEX IF NOT EXISTS idx_report_cards_user_month
  ON public.monthly_report_cards(user_id, month DESC);

ALTER TABLE public.monthly_report_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read their own report cards"
  ON public.monthly_report_cards;
CREATE POLICY "Users read their own report cards"
  ON public.monthly_report_cards
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert their own report cards"
  ON public.monthly_report_cards;
CREATE POLICY "Users insert their own report cards"
  ON public.monthly_report_cards
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update their own report cards"
  ON public.monthly_report_cards;
CREATE POLICY "Users update their own report cards"
  ON public.monthly_report_cards
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
