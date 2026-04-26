-- Audit table for compliance: log every account-deletion request.
-- Rows are inserted by the `delete-user` edge function BEFORE the auth user
-- is removed, so the email/id are still resolvable at write time.
-- After auth.users deletion, all dependent rows (profiles, splats,
-- monthly_report_cards) are removed via existing ON DELETE CASCADE.

CREATE TABLE IF NOT EXISTS public.deleted_users (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  email text,
  deleted_at timestamptz NOT NULL DEFAULT now(),
  reason text,
  metadata jsonb
);

CREATE INDEX IF NOT EXISTS idx_deleted_users_user_id
  ON public.deleted_users(user_id);
CREATE INDEX IF NOT EXISTS idx_deleted_users_deleted_at
  ON public.deleted_users(deleted_at DESC);

ALTER TABLE public.deleted_users ENABLE ROW LEVEL SECURITY;

-- No client should ever read/write this table directly. Only the service role
-- (used inside the `delete-user` edge function) bypasses RLS, so the absence
-- of policies here is intentional — every authenticated/anon request returns 0 rows.
