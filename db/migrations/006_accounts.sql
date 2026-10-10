-- Customer accounts: phone number + one-time SMS code, no passwords.
-- An account is created the first time a mobile number proves it owns the phone.

CREATE TABLE customers (
  id            SERIAL PRIMARY KEY,
  mobile        TEXT NOT NULL UNIQUE,                         -- 09xxxxxxxxx
  name          TEXT NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at TIMESTAMPTZ
);

-- One-time login codes. Only a salted hash of the code is stored, never the code itself.
CREATE TABLE login_codes (
  id          SERIAL PRIMARY KEY,
  mobile      TEXT NOT NULL,
  salt        TEXT NOT NULL,
  code_hash   TEXT NOT NULL,
  attempts    INTEGER NOT NULL DEFAULT 0,                     -- wrong guesses so far
  expires_at  TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,                                    -- used, replaced by a newer code, or locked after too many guesses
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX login_codes_mobile_idx ON login_codes (mobile, created_at DESC);

-- Logged-in browsers. The cookie holds a random token; only its hash is stored, so a database leak cannot be used to log in.
CREATE TABLE customer_sessions (
  id          SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers (id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX customer_sessions_customer_idx ON customer_sessions (customer_id);
