-- Shipping by province and weight.
-- products.weight_g: optional real weight of one piece in grams (empty = a default per category, see lib/shipping.ts).
-- settings: small key/value store for shop settings edited in the admin panel (key 'shipping' = carrier + price tables).
-- orders: what the customer was charged and why, so old orders never change when the price tables do.
ALTER TABLE products ADD COLUMN weight_g INTEGER CHECK (weight_g IS NULL OR (weight_g > 0 AND weight_g <= 20000));

CREATE TABLE settings (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE orders
  ADD COLUMN province         TEXT,
  ADD COLUMN shipping_carrier TEXT,
  ADD COLUMN weight_g         INTEGER;
