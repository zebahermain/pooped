-- Splats: a public-readable record of each "launch" sent from one user to a recipient.
CREATE TABLE public.splats (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_name text NOT NULL DEFAULT '',
  sender_avatar text NOT NULL DEFAULT '💩',
  recipient_name text NOT NULL,
  units integer NOT NULL CHECK (units > 0),
  style text NOT NULL CHECK (style IN ('stealth','cannon','gentle','monsoon')),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.splats ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon recipients via shared link) can view a splat.
CREATE POLICY "Splats are publicly readable"
  ON public.splats
  FOR SELECT
  USING (true);

-- Only the authenticated sender can create their own splat.
CREATE POLICY "Authenticated users can create their own splats"
  ON public.splats
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- Senders can delete their own splats.
CREATE POLICY "Senders can delete their own splats"
  ON public.splats
  FOR DELETE
  TO authenticated
  USING (auth.uid() = sender_id);

CREATE INDEX idx_splats_sender ON public.splats(sender_id);
CREATE INDEX idx_splats_created ON public.splats(created_at DESC);