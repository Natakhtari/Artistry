-- In-app notifications (likes, messages, message reactions, comments, follows).
-- Run on existing DBs after init.sql / deploy_extras (messages).

CREATE TABLE IF NOT EXISTS notifications (
    id            SERIAL PRIMARY KEY,
    user_id       INT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    actor_id      INT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
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
