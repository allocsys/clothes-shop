-- First-party analytics: one row per event. No IP address, no cookie id and no personal data is stored.
-- `visitor` is a hash that changes every day (see lib/analytics.ts), so one person cannot be followed across days.
CREATE TABLE analytics_events (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  event TEXT NOT NULL CHECK (event IN ('pageview', 'product_view', 'add_to_cart', 'checkout_start', 'search', 'order_placed', 'order_paid')),
  visitor TEXT NOT NULL,
  path TEXT NOT NULL,
  product_slug TEXT,
  source TEXT,
  medium TEXT,
  campaign TEXT,
  device TEXT NOT NULL CHECK (device IN ('mobile', 'tablet', 'desktop')),
  query TEXT,
  results INTEGER
);

CREATE INDEX analytics_events_created_idx ON analytics_events (created_at);
CREATE INDEX analytics_events_event_created_idx ON analytics_events (event, created_at);
CREATE INDEX analytics_events_product_idx ON analytics_events (product_slug) WHERE product_slug IS NOT NULL;
