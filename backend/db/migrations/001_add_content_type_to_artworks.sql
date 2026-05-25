-- Run this if you already have a running database (created before this migration).
-- Safe to run multiple times.

ALTER TABLE artworks
    ADD COLUMN IF NOT EXISTS content_type VARCHAR(20) NOT NULL DEFAULT 'photo';
