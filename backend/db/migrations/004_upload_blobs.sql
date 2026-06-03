-- Persist uploaded images in Postgres so they survive API container redeploys (ephemeral disk).
-- Run once on Neon/Supabase after init.sql + deploy_extras.sql.

CREATE TABLE IF NOT EXISTS upload_blobs (
    id         BIGSERIAL PRIMARY KEY,
    user_id    INT          NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    mime_type  VARCHAR(100) NOT NULL,
    data       BYTEA        NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_upload_blobs_user ON upload_blobs (user_id);

-- Longer URLs for /api/files/{id} and CDNs
ALTER TABLE media ALTER COLUMN file_url TYPE VARCHAR(512);
ALTER TABLE profiles ALTER COLUMN profile_picture_url TYPE VARCHAR(512);
ALTER TABLE blog_posts ALTER COLUMN featured_image_url TYPE VARCHAR(512);
