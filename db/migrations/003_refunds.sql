-- The admin marks a payment as "refunded" after returning the money by hand in the gateway panel.
ALTER TABLE payments ADD COLUMN refunded_at TIMESTAMPTZ;
