-- ── Tables ────────────────────────────────────────────────────────────────────

CREATE TABLE "users"
(
    "id"            SERIAL PRIMARY KEY,
    "username"      VARCHAR(150) NOT NULL UNIQUE,
    "email"         VARCHAR(254) NOT NULL UNIQUE,
    "password_hash" VARCHAR(256) NOT NULL,
    "first_name"    VARCHAR(150),
    "last_name"     VARCHAR(150),
    "is_staff"      BOOLEAN     NOT NULL DEFAULT FALSE,
    "is_active"     BOOLEAN     NOT NULL DEFAULT TRUE,
    "date_joined"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "profiles"
(
    "user_id"             INT PRIMARY KEY REFERENCES "users" ("id") ON DELETE CASCADE,
    "bio"                 TEXT,
    "profile_picture_url" VARCHAR(512),
    "cover_photo_url"     VARCHAR(512),
    "website_url"         VARCHAR(200),
    "location"            VARCHAR(100)
);

CREATE TABLE "upload_blobs"
(
    "id"         BIGSERIAL PRIMARY KEY,
    "user_id"    INT          NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
    "mime_type"  VARCHAR(100) NOT NULL,
    "data"       BYTEA        NOT NULL,
    "created_at" TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX "idx_upload_blobs_user" ON "upload_blobs" ("user_id");

CREATE TABLE "artworks"
(
    "id"           SERIAL PRIMARY KEY,
    "user_id"      INT          NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
    "title"        VARCHAR(255) NOT NULL,
    "description"  TEXT,
    "content_type" VARCHAR(20)  NOT NULL DEFAULT 'photo',
    "status"       VARCHAR(10)  NOT NULL DEFAULT 'draft',
    "created_at"   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "published_at" TIMESTAMPTZ
);

CREATE TABLE "media"
(
    "id"         SERIAL PRIMARY KEY,
    "artwork_id" INT          NOT NULL REFERENCES "artworks" ("id") ON DELETE CASCADE,
    "media_type" VARCHAR(10)  NOT NULL,
    "file_url"   VARCHAR(512) NOT NULL,
    "order"      INT          NOT NULL DEFAULT 0
);

CREATE TABLE "blog_posts"
(
    "id"                 SERIAL PRIMARY KEY,
    "user_id"            INT          NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
    "title"              VARCHAR(255) NOT NULL,
    "slug"               VARCHAR(255) NOT NULL UNIQUE,
    "body"               TEXT         NOT NULL,
    "featured_image_url" VARCHAR(512),
    "status"             VARCHAR(10)  NOT NULL DEFAULT 'draft',
    "created_at"         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "published_at"       TIMESTAMPTZ
);

CREATE TABLE "blog_post_artworks"
(
    "blog_post_id" INT NOT NULL REFERENCES "blog_posts" ("id") ON DELETE CASCADE,
    "artwork_id"   INT NOT NULL REFERENCES "artworks" ("id") ON DELETE CASCADE,
    PRIMARY KEY ("blog_post_id", "artwork_id")
);

CREATE TABLE "comments"
(
    "id"                SERIAL PRIMARY KEY,
    "user_id"           INT         NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
    "body"              TEXT        NOT NULL,
    "parent_comment_id" INT REFERENCES "comments" ("id") ON DELETE CASCADE,
    "content_type"      VARCHAR(50) NOT NULL,
    "object_id"         INT         NOT NULL,
    "created_at"        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "likes"
(
    "id"           SERIAL PRIMARY KEY,
    "user_id"      INT         NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
    "content_type" VARCHAR(50) NOT NULL,
    "object_id"    INT         NOT NULL,
    "created_at"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE ("user_id", "content_type", "object_id")
);

CREATE TABLE "follows"
(
    "follower_id"  INT         NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
    "following_id" INT         NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
    "created_at"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY ("follower_id", "following_id")
);

CREATE TABLE "tags"
(
    "id"   SERIAL PRIMARY KEY,
    "name" VARCHAR(50) NOT NULL UNIQUE,
    "slug" VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE "tagging"
(
    "tag_id"       INT         NOT NULL REFERENCES "tags" ("id") ON DELETE CASCADE,
    "content_type" VARCHAR(50) NOT NULL,
    "object_id"    INT         NOT NULL,
    PRIMARY KEY ("tag_id", "content_type", "object_id")
);

CREATE TABLE "news_articles"
(
    "id"           SERIAL PRIMARY KEY,
    "title"        VARCHAR(255) NOT NULL,
    "source_name"  VARCHAR(100),
    "url"          VARCHAR(255) NOT NULL UNIQUE,
    "image_url"    VARCHAR(255),
    "description"  TEXT,
    "published_at" TIMESTAMPTZ,
    "fetched_at"   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE "refresh_tokens"
(
    "id"         SERIAL PRIMARY KEY,
    "user_id"    INT         NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
    "token_hash" VARCHAR(64) NOT NULL UNIQUE,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX idx_comments_content_type_object_id ON comments (content_type, object_id);
CREATE INDEX idx_likes_content_type_object_id    ON likes    (content_type, object_id);
CREATE INDEX idx_tagging_content_type_object_id  ON tagging  (content_type, object_id);
CREATE INDEX idx_artworks_user_id                ON artworks (user_id);
CREATE INDEX idx_artworks_status_created         ON artworks (status, created_at DESC);
CREATE INDEX idx_refresh_tokens_user_id          ON refresh_tokens (user_id);

-- ── Functions ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_user_feed(_user_id INT, _limit INT DEFAULT 20, _offset INT DEFAULT 0)
    RETURNS TABLE
            (
                artwork_id      INT,
                title           VARCHAR,
                file_url        VARCHAR,
                artist_username VARCHAR,
                artist_avatar   VARCHAR,
                created_at      TIMESTAMPTZ
            )
AS $$
BEGIN
    RETURN QUERY
        SELECT a.id                  AS artwork_id,
               a.title,
               m.file_url,
               u.username            AS artist_username,
               p.profile_picture_url AS artist_avatar,
               a.created_at
        FROM artworks a
                 JOIN users u ON a.user_id = u.id
                 JOIN profiles p ON u.id = p.user_id
                 LEFT JOIN media m ON a.id = m.artwork_id AND m."order" = 0
        WHERE a.status = 'published'
          AND a.user_id IN (SELECT following_id FROM follows WHERE follower_id = _user_id)
        ORDER BY a.created_at DESC
        LIMIT _limit OFFSET _offset;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION toggle_like(_user_id INT, _content_type VARCHAR, _object_id INT)
    RETURNS VARCHAR AS $$
DECLARE
    found_id INT;
BEGIN
    SELECT id INTO found_id
    FROM likes
    WHERE user_id = _user_id AND content_type = _content_type AND object_id = _object_id;

    IF found_id IS NOT NULL THEN
        DELETE FROM likes WHERE id = found_id;
        RETURN 'unliked';
    ELSE
        INSERT INTO likes (user_id, content_type, object_id) VALUES (_user_id, _content_type, _object_id);
        RETURN 'liked';
    END IF;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION get_artist_stats(_user_id INT)
    RETURNS TABLE
            (
                total_artworks       BIGINT,
                followers_count      BIGINT,
                following_count      BIGINT,
                total_likes_received BIGINT
            )
AS $$
BEGIN
    RETURN QUERY
        SELECT
            (SELECT COUNT(*) FROM artworks WHERE user_id = _user_id AND status = 'published') AS total_artworks,
            (SELECT COUNT(*) FROM follows WHERE following_id = _user_id)                      AS followers_count,
            (SELECT COUNT(*) FROM follows WHERE follower_id  = _user_id)                      AS following_count,
            (SELECT COUNT(*) FROM likes l JOIN artworks a ON l.object_id = a.id
             WHERE a.user_id = _user_id AND l.content_type = 'artwork')                       AS total_likes_received;
END;
$$ LANGUAGE plpgsql;

-- ── Triggers ──────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION create_profile_for_new_user()
    RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (user_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_profile
    AFTER INSERT ON users
    FOR EACH ROW EXECUTE FUNCTION create_profile_for_new_user();


CREATE OR REPLACE FUNCTION check_self_follow()
    RETURNS TRIGGER AS $$
BEGIN
    IF NEW.follower_id = NEW.following_id THEN
        RAISE EXCEPTION 'Users cannot follow themselves.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_self_follow
    BEFORE INSERT ON follows
    FOR EACH ROW EXECUTE FUNCTION check_self_follow();


CREATE OR REPLACE FUNCTION set_published_at_timestamp()
    RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'published'
        AND (OLD.status IS DISTINCT FROM 'published')
        AND NEW.published_at IS NULL
    THEN
        NEW.published_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_artwork_published_at
    BEFORE UPDATE ON artworks
    FOR EACH ROW EXECUTE FUNCTION set_published_at_timestamp();
