-- Online payment, gateway-agnostic. One order can have several payment attempts
-- (customer closes the gateway page, card declined, tries again).

ALTER TABLE orders
  ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid', 'paid')),
  ADD COLUMN paid_at TIMESTAMPTZ;

CREATE TABLE payments (
  id          SERIAL PRIMARY KEY,
  order_id    INTEGER NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  provider    TEXT NOT NULL,                                  -- 'mock', 'zarinpal', ...
  amount      INTEGER NOT NULL CHECK (amount > 0),            -- Toman, copied from the order at start time
  status      TEXT NOT NULL DEFAULT 'started'
              CHECK (status IN ('started', 'paid', 'failed')),
  reference   TEXT NOT NULL,                                  -- id the gateway gave us at start (Zarinpal: Authority)
  gateway_ref TEXT,                                           -- receipt / tracking number after a successful payment
  card_mask   TEXT,                                           -- e.g. 6037-99**-****-1234
  error       TEXT,                                           -- short reason when failed
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at     TIMESTAMPTZ
);
-- The same gateway reference can never be used twice.
CREATE UNIQUE INDEX payments_provider_ref_idx ON payments (provider, reference);
CREATE INDEX payments_order_idx ON payments (order_id);
-- At most ONE successful payment per order (money can never be counted twice).
CREATE UNIQUE INDEX payments_one_paid_idx ON payments (order_id) WHERE status = 'paid';
