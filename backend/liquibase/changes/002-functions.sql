--liquibase formatted sql

--changeset artistry:002-fn-get_user_feed splitStatements:false
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
AS
$$
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
          AND a.user_id IN (SELECT following_id
                            FROM follows
                            WHERE follower_id = _user_id)
        ORDER BY a.created_at DESC
        LIMIT _limit OFFSET _offset;
END;
$$ LANGUAGE plpgsql;
--rollback DROP FUNCTION IF EXISTS get_user_feed;

--changeset artistry:002-fn-toggle_like splitStatements:false
CREATE OR REPLACE FUNCTION toggle_like(_user_id INT, _content_type VARCHAR, _object_id INT)
    RETURNS VARCHAR AS
$$
DECLARE
    found_id INT;
BEGIN
    SELECT id
    INTO found_id
    FROM likes
    WHERE user_id = _user_id
      AND content_type = _content_type
      AND object_id = _object_id;

    IF found_id IS NOT NULL THEN
        DELETE FROM likes WHERE id = found_id;
        RETURN 'unliked';
    ELSE
        INSERT INTO likes (user_id, content_type, object_id)
        VALUES (_user_id, _content_type, _object_id);
        RETURN 'liked';
    END IF;
END;
$$ LANGUAGE plpgsql;
--rollback DROP FUNCTION IF EXISTS toggle_like;

--changeset artistry:002-fn-get_artist_stats splitStatements:false
CREATE OR REPLACE FUNCTION get_artist_stats(_user_id INT)
    RETURNS TABLE
            (
                total_artworks       BIGINT,
                followers_count      BIGINT,
                following_count      BIGINT,
                total_likes_received BIGINT
            )
AS
$$
BEGIN
    RETURN QUERY SELECT (SELECT COUNT(*)
                         FROM artworks
                         WHERE user_id = _user_id
                           AND status = 'published')                                 AS total_artworks,
                        (SELECT COUNT(*) FROM follows WHERE following_id = _user_id) AS followers_count,
                        (SELECT COUNT(*) FROM follows WHERE follower_id = _user_id)  AS following_count,
                        (SELECT COUNT(*)
                         FROM likes l
                                  JOIN artworks a ON l.object_id = a.id
                         WHERE a.user_id = _user_id
                           AND l.content_type = 'artwork')                           AS total_likes_received;
END;
$$ LANGUAGE plpgsql;
--rollback DROP FUNCTION IF EXISTS get_artist_stats;
