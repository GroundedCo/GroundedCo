-- Consultation requests submitted from /consult.
-- Run this once in the Supabase SQL editor before enabling the form in production.

CREATE TABLE IF NOT EXISTS public.consultations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  mobile_number TEXT NOT NULL CHECK (char_length(mobile_number) BETWEEN 10 AND 20),
  email         TEXT CHECK (email IS NULL OR char_length(email) <= 254),
  image_path    TEXT,
  ip_hash       TEXT CHECK (ip_hash IS NULL OR char_length(ip_hash) = 64),
  notes         TEXT CHECK (notes IS NULL OR char_length(notes) <= 2000),
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'follow_up', 'converted', 'closed')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.consultations
  ADD COLUMN IF NOT EXISTS ip_hash TEXT CHECK (ip_hash IS NULL OR char_length(ip_hash) = 64);

ALTER TABLE public.consultations
  DROP CONSTRAINT IF EXISTS consultations_status_check;

UPDATE public.consultations
SET status = 'pending'
WHERE status = 'new';

ALTER TABLE public.consultations
  ALTER COLUMN status SET DEFAULT 'pending';

ALTER TABLE public.consultations
  ADD CONSTRAINT consultations_status_check
  CHECK (status IN ('pending', 'contacted', 'follow_up', 'converted', 'closed'));

CREATE INDEX IF NOT EXISTS consultations_ip_hash_created_at_idx
  ON public.consultations (ip_hash, created_at DESC)
  WHERE ip_hash IS NOT NULL;

-- The table intentionally has no public policies. The Route Handler writes with
-- the server-only service role key, while customer details remain private.

DROP POLICY IF EXISTS "Admins can read consultations" ON public.consultations;
CREATE POLICY "Admins can read consultations"
  ON public.consultations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update consultations" ON public.consultations;
CREATE POLICY "Admins can update consultations"
  ON public.consultations FOR UPDATE
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

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'consultation-images',
  'consultation-images',
  FALSE,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- No storage.objects policies are required: uploads and cleanup are performed
-- only by the server-side service role client.

DROP POLICY IF EXISTS "Admins can read consultation images" ON storage.objects;
CREATE POLICY "Admins can read consultation images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'consultation-images'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );
