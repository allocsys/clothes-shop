-- Every SMS the shop tries to send (order confirmation now, login codes later).
-- One row per message: shows in the database what was sent, to whom, and why a send failed.

CREATE TABLE sms_log (
  id         SERIAL PRIMARY KEY,
  kind       TEXT NOT NULL,                                   -- 'order_placed', later 'login_code', ...
  order_code TEXT,                                            -- MP-XXXXXXXX when the message is about an order
  mobile     TEXT NOT NULL,                                   -- 09xxxxxxxxx
  body       TEXT NOT NULL,
  provider   TEXT NOT NULL,                                    -- 'mock', 'kavenegar', ...
  status     TEXT NOT NULL DEFAULT 'pending'
             CHECK (status IN ('pending', 'sent', 'failed')),
  reference  TEXT,                                            -- the provider's own message id
  error      TEXT,                                            -- short reason when failed
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at    TIMESTAMPTZ
);
-- One message of each kind per order: a retried request or a double click can never text the customer twice.
CREATE UNIQUE INDEX sms_log_order_kind_idx ON sms_log (kind, order_code) WHERE order_code IS NOT NULL;
CREATE INDEX sms_log_created_idx ON sms_log (created_at DESC);
