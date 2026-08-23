-- Shop: set di unghie già fatte (press-on / custom sets)
-- Idempotente.

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price_cents INTEGER NOT NULL,
  shape TEXT NOT NULL DEFAULT 'almond',
  length TEXT NOT NULL DEFAULT 'M',
  colors TEXT NOT NULL DEFAULT '[]',
  image_url TEXT NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  ALTER TABLE order_items
    ADD COLUMN product_id TEXT REFERENCES products(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_products_sort ON products (sort_order);

INSERT INTO products (id, name, description, price_cents, shape, length, colors, sort_order) VALUES
  ('nude-soft', 'Nude Soft', 'Set nude lucido, elegante e naturale. Pronto da indossare.', 2800, 'almond', 'M', '["#f3d5cc","#e8c4b8","#f7e4dc","#e2b7aa","#f0d0c6"]', 10),
  ('french-etoile', 'French Étoile', 'French classica su base rosa latte, con un tocco di luce.', 3200, 'almond', 'M', '["#f8e8e4","#ffffff","#f4d4d0","#fffaf7","#ead7d2"]', 20),
  ('babyboomer-blush', 'Babyboomer Blush', 'Sfumatura babyboomer dal rosa al bianco, effetto seta.', 3400, 'almond', 'M', '["#f6d5d8","#fbe9ea","#ffffff","#f3c9ce","#fff5f4"]', 30),
  ('cherry-glam', 'Cherry Glam', 'Bordeaux lucido, intenso e sofisticato.', 3000, 'coffin', 'M', '["#6b1c2a","#8f2436","#4a121c","#a32e42","#5c1824"]', 40),
  ('mint-whisper', 'Mint Whisper', 'Verde menta pastello, fresco e delicato.', 2800, 'square', 'S', '["#cfe8dc","#b7dccb","#e7f5ee","#9fcbb8","#d9efe4"]', 50),
  ('gold-sparkle', 'Gold Sparkle', 'Base champagne con dettagli oro. Per le occasioni speciali.', 3800, 'stiletto', 'L', '["#e8d5a3","#c4a35a","#f4e8c4","#d4af37","#b8943f"]', 60)
ON CONFLICT (id) DO NOTHING;
