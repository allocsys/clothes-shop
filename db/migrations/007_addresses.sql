-- Saved delivery addresses of a logged-in customer (used to fill in the order form).
-- At most one default address per customer is enforced by the database itself.

CREATE TABLE customer_addresses (
  id          SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers (id) ON DELETE CASCADE,
  title       TEXT NOT NULL DEFAULT '',          -- short label, e.g. home / work (optional)
  city        TEXT NOT NULL,
  postal_code TEXT NOT NULL DEFAULT '',
  address     TEXT NOT NULL,
  is_default  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX customer_addresses_customer_idx ON customer_addresses (customer_id);
CREATE UNIQUE INDEX customer_addresses_one_default ON customer_addresses (customer_id) WHERE is_default;
