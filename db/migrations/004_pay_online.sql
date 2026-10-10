-- Orders created while online payment was ON wait for the money and hold their stock only for a limited time.
-- Orders made without online payment (customer pays offline) never expire.
ALTER TABLE orders ADD COLUMN pay_online BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX orders_expiry_idx ON orders (created_at) WHERE pay_online AND payment_status = 'unpaid' AND status = 'new';
