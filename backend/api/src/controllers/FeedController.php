<?php

declare(strict_types=1);

class FeedController
{
    public function index(array $params): void
    {
        $limit  = max(1, min(50, (int) ($_GET['limit']  ?? 20)));
        $offset = max(0,          (int) ($_GET['offset'] ?? 0));
        $userId = (int) $params['_user_id'];

        $db   = Database::getInstance();
        $stmt = $db->prepare(
            'SELECT a.id, a.title, a.description, a.content_type, a.created_at,
                    TRIM(COALESCE(u.first_name,\'\') || \' \' || COALESCE(u.last_name,\'\')) AS artist_name,
                    u.username AS artist_username,
                    p.profile_picture_url AS artist_avatar,
                    th.file_url AS thumbnail,
                    (SELECT file_url FROM media m2
                     WHERE m2.artwork_id = a.id AND m2.media_type IN (\'audio\', \'video\')
                     ORDER BY m2."order" ASC LIMIT 1) AS media_src,
                    (SELECT COUNT(*) FROM likes WHERE content_type = \'artwork\' AND object_id = a.id) AS likes_count,
                    (SELECT COUNT(*) FROM comments WHERE content_type = \'artwork\' AND object_id = a.id) AS comments_count
             FROM artworks a
             JOIN users u ON a.user_id = u.id
             LEFT JOIN profiles p ON u.id = p.user_id
             LEFT JOIN LATERAL (
                 SELECT mo.file_url
                 FROM media mo
                 WHERE mo.artwork_id = a.id AND mo.media_type = \'image\'
                 ORDER BY mo."order" ASC
                 LIMIT 1
             ) th ON true
             WHERE a.status = \'published\'
               AND a.user_id IN (
                   SELECT following_id FROM follows WHERE follower_id = :uid
               )
             ORDER BY a.created_at DESC
             LIMIT :lim OFFSET :off'
        );
        $stmt->execute(['uid' => $userId, 'lim' => $limit, 'off' => $offset]);

        Response::ok([
            'items'  => $stmt->fetchAll(),
            'limit'  => $limit,
            'offset' => $offset,
        ]);
    }
}
