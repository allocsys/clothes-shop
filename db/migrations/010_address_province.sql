-- Saved addresses remember the province, so the cart can pick it (and the shipping fee) by itself.
-- NULL on addresses saved before this: the customer picks the province in the cart, and sets it when editing the address.
ALTER TABLE customer_addresses ADD COLUMN province TEXT;
