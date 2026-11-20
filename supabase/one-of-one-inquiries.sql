-- "One of 1" pieces and their private acquisition inquiries.
-- Run this once in the Supabase SQL editor.

-- Marks a featured product as a "One of 1" piece. Those cards show
-- INQUIRE TO ACQUIRE instead of Bring It Home.
ALTER TABLE public.featured_products
  ADD COLUMN IF NOT EXISTS is_one_of_one BOOLEAN NOT NULL DEFAULT FALSE;

-- "One of 1" cards hide the price unless this is ticked in admin.
-- (Regular products always show their price.)
ALTER TABLE public.featured_products
  ADD COLUMN IF NOT EXISTS show_price BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS public.one_of_one_inquiries (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id     TEXT,
  piece_name     TEXT NOT NULL CHECK (char_length(piece_name) BETWEEN 1 AND 200),
  name           TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  contact        TEXT NOT NULL CHECK (char_length(contact) BETWEEN 5 AND 254),
  city_space     TEXT NOT NULL CHECK (char_length(city_space) BETWEEN 1 AND 200),
  bid_amount_inr BIGINT NOT NULL CHECK (bid_amount_inr > 0),
  spatial_notes  TEXT CHECK (spatial_notes IS NULL OR char_length(spatial_notes) <= 2000),
  ip_hash        TEXT CHECK (ip_hash IS NULL OR char_length(ip_hash) = 64),
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'accepted', 'declined', 'closed')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.one_of_one_inquiries ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS one_of_one_inquiries_ip_hash_created_at_idx
  ON public.one_of_one_inquiries (ip_hash, created_at DESC)
  WHERE ip_hash IS NOT NULL;

-- Used by the per-contact and site-wide rate limits
CREATE INDEX IF NOT EXISTS one_of_one_inquiries_contact_created_at_idx
  ON public.one_of_one_inquiries (contact, created_at DESC);
CREATE INDEX IF NOT EXISTS one_of_one_inquiries_created_at_idx
  ON public.one_of_one_inquiries (created_at DESC);

-- No public policies: the Route Handler writes with the server-only service
-- role key. Admins can read and update.

DROP POLICY IF EXISTS "Admins can read one of one inquiries" ON public.one_of_one_inquiries;
CREATE POLICY "Admins can read one of one inquiries"
  ON public.one_of_one_inquiries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update one of one inquiries" ON public.one_of_one_inquiries;
CREATE POLICY "Admins can update one of one inquiries"
  ON public.one_of_one_inquiries FOR UPDATE
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

DROP POLICY IF EXISTS "Admins can delete one of one inquiries" ON public.one_of_one_inquiries;
CREATE POLICY "Admins can delete one of one inquiries"
  ON public.one_of_one_inquiries FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- ─── Internal admin comments on each bid ─────────────────────
-- Never shown to customers. Deleted automatically with their bid.

CREATE TABLE IF NOT EXISTS public.one_of_one_inquiry_comments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id   UUID NOT NULL REFERENCES public.one_of_one_inquiries(id) ON DELETE CASCADE,
  author_email TEXT,
  body         TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.one_of_one_inquiry_comments ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS one_of_one_inquiry_comments_inquiry_idx
  ON public.one_of_one_inquiry_comments (inquiry_id, created_at);

DROP POLICY IF EXISTS "Admins manage one of one inquiry comments" ON public.one_of_one_inquiry_comments;
CREATE POLICY "Admins manage one of one inquiry comments"
  ON public.one_of_one_inquiry_comments FOR ALL
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
