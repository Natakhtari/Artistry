-- Run after init.sql on a fresh database (Neon, Supabase, etc.) if you use chat + message likes.
-- Safe to run multiple times if wrapped in IF NOT EXISTS patterns below.

CREATE TABLE IF NOT EXISTS direct_messages (
  id           SERIAL PRIMARY KEY,
  sender_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body         TEXT NOT NULL DEFAULT '',
  media_url    VARCHAR(500),
  media_type   VARCHAR(20),
  read_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dm_conversation ON direct_messages (
  LEAST(sender_id, recipient_id), GREATEST(sender_id, recipient_id), created_at
);

CREATE TABLE IF NOT EXISTS message_likes (
  message_id INT NOT NULL REFERENCES direct_messages(id) ON DELETE CASCADE,
  user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (message_id, user_id)
);
