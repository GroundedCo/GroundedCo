-- ============================================================
-- GROUNDED — Missing Tables Migration (Self-Hosted Supabase)
-- 
-- Run this AFTER the initial migration.sql.
-- Paste into: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ============================================================
-- 1. ORDERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_ref           TEXT NOT NULL UNIQUE,
  razorpay_order_id   TEXT,
  razorpay_payment_id TEXT,
  product_id          UUID REFERENCES featured_products(id) ON DELETE SET NULL,
  product_name        TEXT NOT NULL,
  quantity            INT NOT NULL DEFAULT 1,
  amount_paise        INT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  customer_name       TEXT,
  customer_email      TEXT,
  customer_phone      TEXT,
  address_line1       TEXT,
  address_line2       TEXT,
  address_city        TEXT,
  address_state       TEXT,
  address_pincode     TEXT,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. STOCK_ENTRIES TABLE (inventory audit trail)
-- ============================================================
CREATE TABLE IF NOT EXISTS stock_entries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES featured_products(id) ON DELETE CASCADE,
  admin_email TEXT NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('restock', 'adjustment', 'damage', 'return', 'sale')),
  delta       INT NOT NULL,
  new_total   INT NOT NULL,
  notes       TEXT DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. INVOICE_SETTINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS invoice_settings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_html    TEXT,
  business_name    TEXT DEFAULT 'Grounded',
  business_address TEXT DEFAULT '',
  gstin            TEXT DEFAULT '',
  footer_note      TEXT DEFAULT 'Thank you for your purchase.',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default invoice settings row
INSERT INTO invoice_settings (business_name, business_address, gstin, footer_note, template_html)
SELECT 'Grounded', '', '', 'Thank you for your purchase.', NULL
WHERE NOT EXISTS (SELECT 1 FROM invoice_settings LIMIT 1);

-- ============================================================
-- 4. CONTACT_SETTINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS contact_settings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name  TEXT DEFAULT '',
  tagline     TEXT DEFAULT '',
  email       TEXT DEFAULT '',
  whatsapp    TEXT DEFAULT '',
  location    TEXT DEFAULT '',
  story_text  TEXT DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default contact settings row
INSERT INTO contact_settings (brand_name, tagline, email, whatsapp, location, story_text)
SELECT 'Grounded', '', '', '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM contact_settings LIMIT 1);

-- ============================================================
-- 5. SITE_PAGES TABLE (CMS for legal/info pages)
-- ============================================================
CREATE TABLE IF NOT EXISTS site_pages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug       TEXT NOT NULL UNIQUE,
  title      TEXT NOT NULL,
  content    TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default pages
INSERT INTO site_pages (slug, title, content)
SELECT 'shipping', 'Shipping & Delivery', ''
WHERE NOT EXISTS (SELECT 1 FROM site_pages WHERE slug = 'shipping');

INSERT INTO site_pages (slug, title, content)
SELECT 'privacy', 'Privacy Policy', ''
WHERE NOT EXISTS (SELECT 1 FROM site_pages WHERE slug = 'privacy');

-- ============================================================
-- 6. AUTO-UPDATE updated_at TRIGGERS
-- ============================================================
-- The update_updated_at_column() function should already exist from migration.sql.
-- If the function doesn't exist, create it:
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $func$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoice_settings_updated_at ON invoice_settings;
CREATE TRIGGER update_invoice_settings_updated_at
  BEFORE UPDATE ON invoice_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_contact_settings_updated_at ON contact_settings;
CREATE TRIGGER update_contact_settings_updated_at
  BEFORE UPDATE ON contact_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_site_pages_updated_at ON site_pages;
CREATE TRIGGER update_site_pages_updated_at
  BEFORE UPDATE ON site_pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 7. ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_pages ENABLE ROW LEVEL SECURITY;

-- --- ORDERS ---
-- Admins can read all orders
CREATE POLICY "Admins can read all orders"
  ON orders FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can update order status
CREATE POLICY "Admins can update orders"
  ON orders FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Service role inserts orders (via API route — bypasses RLS)
-- No INSERT policy needed since API routes use the service_role key

-- --- STOCK ENTRIES ---
-- Admins can read all stock entries
CREATE POLICY "Admins can read stock entries"
  ON stock_entries FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can insert stock entries
CREATE POLICY "Admins can insert stock entries"
  ON stock_entries FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- --- INVOICE SETTINGS ---
-- Admins can read/update invoice settings
CREATE POLICY "Admins can read invoice settings"
  ON invoice_settings FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can insert invoice settings"
  ON invoice_settings FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update invoice settings"
  ON invoice_settings FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- --- CONTACT SETTINGS ---
-- Public can read contact settings (used on /contact page)
CREATE POLICY "Public can read contact settings"
  ON contact_settings FOR SELECT
  USING (true);

-- Admins can manage contact settings
CREATE POLICY "Admins can insert contact settings"
  ON contact_settings FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update contact settings"
  ON contact_settings FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- --- SITE PAGES ---
-- Public can read site pages (used on /shipping and /privacy)
CREATE POLICY "Public can read site pages"
  ON site_pages FOR SELECT
  USING (true);

-- Admins can manage site pages
CREATE POLICY "Admins can insert site pages"
  ON site_pages FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update site pages"
  ON site_pages FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- DONE
-- ============================================================
-- After running this migration, verify with:
--   SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
-- 
-- Expected tables: carousel_products, contact_settings, featured_products,
--   invoice_settings, orders, profiles, site_pages, stock_entries
-- ============================================================