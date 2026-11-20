-- ============================================================
-- Per-product price / stock visibility
--   show_price  — already exists (added for "One of 1"), now applies
--                 to every product.
--   show_stock  — new; shows the "N available" count on the card.
-- Safe to re-run: the one-time backfill only runs the first time,
-- when show_stock is being added.
-- ============================================================
ALTER TABLE public.featured_products
  ADD COLUMN IF NOT EXISTS show_price BOOLEAN NOT NULL DEFAULT FALSE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'featured_products'
      AND column_name  = 'show_stock'
  ) THEN
    ALTER TABLE public.featured_products
      ADD COLUMN show_stock BOOLEAN NOT NULL DEFAULT TRUE;

    -- Regular products always showed their price before this change;
    -- keep them that way. "One of 1" pieces keep their existing setting.
    UPDATE public.featured_products
      SET show_price = TRUE
      WHERE is_one_of_one IS NOT TRUE;
  END IF;
END $$;
