CREATE TABLE IF NOT EXISTS coupons (
  code TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('percent','fixed')),
  value INTEGER NOT NULL,
  expires_at TEXT,
  max_uses INTEGER,
  uses INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_coupons_active
ON coupons(active);

ALTER TABLE orders ADD COLUMN coupon_code TEXT;

ALTER TABLE orders ADD COLUMN discount INTEGER NOT NULL DEFAULT 0;
