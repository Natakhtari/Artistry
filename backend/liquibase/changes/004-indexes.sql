--liquibase formatted sql

--changeset artistry:004-idx-comments-content
CREATE INDEX idx_comments_content_type_object_id ON comments (content_type, object_id);
--rollback DROP INDEX IF EXISTS idx_comments_content_type_object_id;

--changeset artistry:004-idx-likes-content
CREATE INDEX idx_likes_content_type_object_id ON likes (content_type, object_id);
--rollback DROP INDEX IF EXISTS idx_likes_content_type_object_id;

--changeset artistry:004-idx-tagging-content
CREATE INDEX idx_tagging_content_type_object_id ON tagging (content_type, object_id);
--rollback DROP INDEX IF EXISTS idx_tagging_content_type_object_id;

--changeset artistry:004-idx-artworks-user
CREATE INDEX idx_artworks_user_id ON artworks (user_id);
--rollback DROP INDEX IF EXISTS idx_artworks_user_id;

--changeset artistry:004-idx-artworks-status
CREATE INDEX idx_artworks_status_created ON artworks (status, created_at DESC);
--rollback DROP INDEX IF EXISTS idx_artworks_status_created;

--changeset artistry:004-idx-refresh-tokens-user
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);
--rollback DROP INDEX IF EXISTS idx_refresh_tokens_user_id;
