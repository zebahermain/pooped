ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS reservoir_units integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reservoir_max integer NOT NULL DEFAULT 500,
  ADD COLUMN IF NOT EXISTS reservoir_notified boolean NOT NULL DEFAULT false;