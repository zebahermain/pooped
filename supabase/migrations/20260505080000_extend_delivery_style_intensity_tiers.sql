-- Extend the splats.style CHECK constraint with the 6 new intensity-tier
-- values used by the rewritten "How Much?" SendSheet.
--
-- The original values (stealth, cannon, gentle, monsoon) are kept so that
-- splats inserted before this migration still satisfy the constraint.
-- New values map 1:1 onto the SendSheet INTENSITY_TIERS list.
--
-- Idempotent: drops the auto-named CHECK if it exists, then re-adds
-- a named one so future migrations can target it cleanly.

ALTER TABLE public.splats
  DROP CONSTRAINT IF EXISTS splats_style_check;

ALTER TABLE public.splats
  DROP CONSTRAINT IF EXISTS splats_style_intensity_check;

ALTER TABLE public.splats
  ADD CONSTRAINT splats_style_intensity_check
  CHECK (
    style IN (
      -- Legacy values (kept for backward compatibility with existing rows).
      'stealth',
      'cannon',
      'gentle',
      'monsoon',
      -- New intensity-tier values (1:1 with INTENSITY_TIERS in SendSheet.tsx).
      'drip',
      'puff',
      'blaze',
      'eruption',
      'overload',
      'apocalypse'
    )
  );
