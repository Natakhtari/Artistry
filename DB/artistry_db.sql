CREATE TABLE "users"
(
    "id"          SERIAL PRIMARY KEY,
    "username"    VARCHAR(150) NOT NULL UNIQUE,
    "email"       VARCHAR(254) NOT NULL UNIQUE,
    "password_hash"    VARCHAR(128) NOT NULL,
    "first_name"  VARCHAR(150),
    "last_name"   VARCHAR(150),
    "is_staff"    BOOLEAN      NOT NULL DEFAULT FALSE,
    "is_active"   BOOLEAN      NOT NULL DEFAULT TRUE,
    "date_joined" TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE "profiles"
(
    "user_id"             INT PRIMARY KEY REFERENCES "users" ("id") ON DELETE CASCADE,
    "bio"                 TEXT,
    "profile_picture_url" VARCHAR(255),
    "cover_photo_url"     VARCHAR(255),
    "website_url"         VARCHAR(200),
    "location"            VARCHAR(100)
);

CREATE TABLE "artworks"
(
    "id"           SERIAL PRIMARY KEY,
    "user_id"      INT          NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
    "title"        VARCHAR(255) NOT NULL,
    "description"  TEXT,
    "status"       VARCHAR(10)  NOT NULL DEFAULT 'draft',
    "created_at"   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "published_at" TIMESTAMPTZ
);

CREATE TABLE "media"
(
    "id"         SERIAL PRIMARY KEY,
    "artwork_id" INT          NOT NULL REFERENCES "artworks" ("id") ON DELETE CASCADE,
    "media_type" VARCHAR(10)  NOT NULL,
    "file_url"   VARCHAR(255) NOT NULL,
    "order"      INT          NOT NULL DEFAULT 0
);

CREATE TABLE "blog_posts"
(
    "id"                 SERIAL PRIMARY KEY,
    "user_id"            INT          NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
    "title"              VARCHAR(255) NOT NULL,
    "slug"               VARCHAR(255) NOT NULL UNIQUE,
    "body"               TEXT         NOT NULL,
    "featured_image_url" VARCHAR(255),
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

-- CREATE INDEX "idx_comments_content_type_object_id" ON "comments" ("content_type", "object_id");
-- CREATE INDEX "idx_likes_content_type_object_id" ON "likes" ("content_type", "object_id");
-- CREATE INDEX "idx_taggings_content_type_object_id" ON "tagging" ("content_type", "object_id");