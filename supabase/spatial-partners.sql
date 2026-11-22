-- Spatial Partner Registry: architects, interior designers and spatial studios
-- who register from /spatial-partners. Every new row starts as 'pending_review'
-- so the team can vet the practice before granting partner benefits.
-- Run this once in the Supabase SQL editor.

CREATE TABLE IF NOT EXISTS public.spatial_partners (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_name    TEXT NOT NULL CHECK (char_length(studio_name) BETWEEN 1 AND 160),
  lead_designer  TEXT NOT NULL CHECK (char_length(lead_designer) BETWEEN 1 AND 120),
  practice_type  TEXT NOT NULL CHECK (practice_type IN (
    'architecture', 'interior_design', 'architecture_interiors', 'hospitality_design',
    'landscape', 'styling', 'other'
  )),
  regions        TEXT NOT NULL CHECK (char_length(regions) BETWEEN 1 AND 200),
  portfolio_url  TEXT NOT NULL CHECK (char_length(portfolio_url) BETWEEN 8 AND 500),
  project_focus  TEXT[] NOT NULL DEFAULT '{}',
  timeline       TEXT NOT NULL CHECK (timeline IN (
    'active_now', 'within_3_months', 'within_6_months', 'exploring'
  )),
  email          TEXT NOT NULL CHECK (char_length(email) BETWEEN 5 AND 254),
  phone          TEXT NOT NULL CHECK (char_length(phone) BETWEEN 10 AND 20),
  notes          TEXT CHECK (notes IS NULL OR char_length(notes) <= 2000),
  ip_hash        TEXT CHECK (ip_hash IS NULL OR char_length(ip_hash) = 64),
  status         TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN (
    'pending_review', 'approved', 'waitlisted', 'declined'
  )),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.spatial_partners ENABLE ROW LEVEL SECURITY;

-- Used by the rate limits in the Route Handler
CREATE INDEX IF NOT EXISTS spatial_partners_ip_hash_created_at_idx
  ON public.spatial_partners (ip_hash, created_at DESC)
  WHERE ip_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS spatial_partners_email_created_at_idx
  ON public.spatial_partners (email, created_at DESC);
CREATE INDEX IF NOT EXISTS spatial_partners_created_at_idx
  ON public.spatial_partners (created_at DESC);

-- No public policies: the Route Handler writes with the server-only service
-- role key. Admins can read and update (to move a studio out of review).

DROP POLICY IF EXISTS "Admins can read spatial partners" ON public.spatial_partners;
CREATE POLICY "Admins can read spatial partners"
  ON public.spatial_partners FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update spatial partners" ON public.spatial_partners;
CREATE POLICY "Admins can update spatial partners"
  ON public.spatial_partners FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );
