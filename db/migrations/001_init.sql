-- MahPari shop: first schema (products, stock per size/color, orders)
-- Categories stay in code (data/categories.ts); products.category holds the slug.

CREATE TABLE products (
  id          SERIAL PRIMARY KEY,
  slug        TEXT NOT NULL UNIQUE,
  title       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category    TEXT NOT NULL,
  price       INTEGER NOT NULL CHECK (price >= 0),          -- toman
  old_price   INTEGER CHECK (old_price IS NULL OR old_price > price),
  images      TEXT[] NOT NULL DEFAULT '{}',                  -- first one is the main photo
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,                 -- false = hidden from the shop
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX products_category_idx ON products (category);

-- One row per size + color combination, with its own stock count.
CREATE TABLE variants (
  id         SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  size       TEXT NOT NULL,
  color      TEXT NOT NULL,
  stock      INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  UNIQUE (product_id, size, color)
);

CREATE TABLE orders (
  id            SERIAL PRIMARY KEY,
  code          TEXT NOT NULL UNIQUE,                        -- tracking code, e.g. MP-XXXXXXXX
  status        TEXT NOT NULL DEFAULT 'new'
                CHECK (status IN ('new', 'confirmed', 'shipped', 'delivered', 'canceled')),
  customer_name TEXT NOT NULL,
  mobile        TEXT NOT NULL,
  city          TEXT NOT NULL,
  postal_code   TEXT NOT NULL DEFAULT '',
  address       TEXT NOT NULL,
  note          TEXT NOT NULL DEFAULT '',
  subtotal      INTEGER NOT NULL CHECK (subtotal >= 0),
  shipping      INTEGER NOT NULL CHECK (shipping >= 0),
  total         INTEGER NOT NULL CHECK (total >= 0),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX orders_created_idx ON orders (created_at DESC);
CREATE INDEX orders_mobile_idx ON orders (mobile);

-- Snapshot of what was bought (title and price at order time), so later edits to a product never change old orders.
CREATE TABLE order_items (
  id           SERIAL PRIMARY KEY,
  order_id     INTEGER NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  product_slug TEXT NOT NULL,
  title        TEXT NOT NULL,
  size         TEXT NOT NULL,
  color        TEXT NOT NULL,
  qty          INTEGER NOT NULL CHECK (qty > 0),
  unit_price   INTEGER NOT NULL CHECK (unit_price >= 0)
);
CREATE INDEX order_items_order_idx ON order_items (order_id);
