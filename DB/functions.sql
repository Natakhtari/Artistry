--This is the most complex query in social apps. You need to fetch artworks only from the people the user follows, ordered by newest first.
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
                 LEFT JOIN media m ON a.id = m.artwork_id AND m.order = 0
        WHERE a.status = 'published'
          AND a.user_id IN (SELECT following_id
                            FROM follows
                            WHERE follower_id = _user_id)
        ORDER BY a.created_at DESC
        LIMIT _limit OFFSET _offset;
END;
$$ LANGUAGE plpgsql;


--In the UI, the user just clicks "Heart". You don't want to write frontend logic to check "Did they like it? If yes delete, if no create." This function handles that "toggle" logic in one database call.
CREATE OR REPLACE FUNCTION toggle_like(_user_id INT, _content_type VARCHAR, _object_id INT)
    RETURNS VARCHAR AS
$$
DECLARE
    found_id INT;
BEGIN
    -- Check if the like already exists
    SELECT id
    INTO found_id
    FROM likes
    WHERE user_id = _user_id
      AND content_type = _content_type
      AND object_id = _object_id;

    IF found_id IS NOT NULL THEN
        -- Unlike
        DELETE FROM likes WHERE id = found_id;
        RETURN 'unliked';
    ELSE
        -- Like
        INSERT INTO likes (user_id, content_type, object_id)
        VALUES (_user_id, _content_type, _object_id);
        RETURN 'liked';
    END IF;
END;
$$ LANGUAGE plpgsql;


--On the "Profile" page, you need to show counts (Followers, Following, Artworks, Total Likes Received). Doing this in 4 separate queries is slow. This does it in one.
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


