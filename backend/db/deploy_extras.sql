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

-- In-app notifications (see migrations/003_notifications.sql)
CREATE TABLE IF NOT EXISTS notifications (
  id            SERIAL PRIMARY KEY,
  user_id       INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id      INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type          VARCHAR(40) NOT NULL,
  object_type   VARCHAR(40),
  object_id     INT,
  body_preview  VARCHAR(240),
  read_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications (user_id) WHERE read_at IS NULL;

-- Image blobs (run once; survives Render/Fly ephemeral disk redeploys)
CREATE TABLE IF NOT EXISTS upload_blobs (
    id         BIGSERIAL PRIMARY KEY,
    user_id    INT          NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    mime_type  VARCHAR(100) NOT NULL,
    data       BYTEA        NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_upload_blobs_user ON upload_blobs (user_id);

ALTER TABLE media ALTER COLUMN file_url TYPE VARCHAR(512);
ALTER TABLE profiles ALTER COLUMN profile_picture_url TYPE VARCHAR(512);
ALTER TABLE blog_posts ALTER COLUMN featured_image_url TYPE VARCHAR(512);
