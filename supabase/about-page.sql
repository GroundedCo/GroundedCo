-- ============================================================
-- About Us page
--   Reuses the site_pages CMS table (slug = 'about') and adds an
--   optional banner image column, editable from /admin/pages.
-- Safe to re-run.
-- ============================================================
ALTER TABLE public.site_pages
  ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT '';

INSERT INTO public.site_pages (slug, title, content, image_url)
SELECT 'about', 'About Us', '', ''
WHERE NOT EXISTS (SELECT 1 FROM public.site_pages WHERE slug = 'about');
