<?php

declare(strict_types=1);

class ArtworkController
{
    public function index(array $params): void
    {
        $limit  = max(1, min(50, (int) ($_GET['limit']   ?? 20)));
        $offset = max(0,          (int) ($_GET['offset']  ?? 0));
        $userId = isset($_GET['user_id']) ? (int) $_GET['user_id'] : null;

        $db  = Database::getInstance();
        $sql = 'SELECT a.id, a.title, a.description, a.content_type, a.status, a.created_at, a.published_at,
                       TRIM(COALESCE(u.first_name,\'\') || \' \' || COALESCE(u.last_name,\'\')) AS artist_name,
                       u.username AS artist_username,
                       p.profile_picture_url AS artist_avatar,
                       m.file_url AS thumbnail,
                       (SELECT file_url FROM media m2
                        WHERE m2.artwork_id = a.id AND m2.media_type != \'image\'
                        ORDER BY m2."order" LIMIT 1) AS media_src,
                       (SELECT COUNT(*) FROM likes WHERE content_type = \'artwork\' AND object_id = a.id) AS likes_count,
                       (SELECT COUNT(*) FROM comments WHERE content_type = \'artwork\' AND object_id = a.id) AS comments_count
                FROM artworks a
                JOIN users u ON a.user_id = u.id
                LEFT JOIN profiles p ON u.id = p.user_id
                LEFT JOIN media m ON a.id = m.artwork_id AND m."order" = 0
                WHERE a.status = \'published\'';

        $binds = [];

        if ($userId !== null) {
            $sql        .= ' AND a.user_id = :uid';
            $binds['uid'] = $userId;
        }

        $sql .= ' ORDER BY a.created_at DESC LIMIT :lim OFFSET :off';
        $binds['lim'] = $limit;
        $binds['off'] = $offset;

        $stmt = $db->prepare($sql);
        $stmt->execute($binds);

        Response::ok([
            'items'  => $stmt->fetchAll(),
            'limit'  => $limit,
            'offset' => $offset,
        ]);
    }

    public function show(array $params): void
    {
        $db   = Database::getInstance();
        $stmt = $db->prepare(
            'SELECT a.id, a.title, a.description, a.status, a.created_at, a.published_at,
                    u.id AS user_id, u.username AS artist_username,
                    p.profile_picture_url AS artist_avatar,
                    (SELECT COUNT(*) FROM likes WHERE content_type = \'artwork\' AND object_id = a.id) AS like_count,
                    (SELECT json_agg(json_build_object(\'id\', m.id, \'type\', m.media_type, \'url\', m.file_url, \'order\', m."order\") ORDER BY m."order")
                     FROM media m WHERE m.artwork_id = a.id) AS media
             FROM artworks a
             JOIN users u ON a.user_id = u.id
             JOIN profiles p ON u.id = p.user_id
             WHERE a.id = :id AND a.status = \'published\''
        );
        $stmt->execute(['id' => (int) $params['id']]);
        $artwork = $stmt->fetch();

        if (!$artwork) {
            Response::error('Artwork not found', 404);
        }

        // Decode the aggregated JSON media array
        $artwork['media'] = json_decode($artwork['media'] ?? 'null', true) ?? [];

        Response::ok($artwork);
    }

    public function store(array $params): void
    {
        $body = json_decode(file_get_contents('php://input') ?: '{}', true) ?? [];

        $title       = trim($body['title']        ?? '');
        $description = trim($body['description']  ?? '');
        $mediaUrl    = trim($body['media_url']     ?? '');
        $contentType = in_array($body['content_type'] ?? '', ['photo', 'video', 'podcast', 'article'], true)
                       ? $body['content_type'] : 'photo';
        $status      = in_array($body['status'] ?? 'published', ['draft', 'published'], true)
                       ? $body['status'] : 'published';

        if ($title === '') {
            Response::validationError(['title' => 'Title is required']);
        }
        if (strlen($title) > 255) {
            Response::validationError(['title' => 'Title must be 255 characters or fewer']);
        }
        if ($mediaUrl === '') {
            Response::validationError(['media_url' => 'A media URL or uploaded file is required']);
        }

        $db = Database::getInstance();
        $db->beginTransaction();

        try {
            $stmt = $db->prepare(
                'INSERT INTO artworks (user_id, title, description, content_type, status)
                 VALUES (:uid, :title, :desc, :ctype, :status)
                 RETURNING id, title, description, content_type, status, created_at'
            );
            $stmt->execute([
                'uid'    => (int) $params['_user_id'],
                'title'  => $title,
                'desc'   => $description ?: null,
                'ctype'  => $contentType,
                'status' => $status,
            ]);
            $artwork = $stmt->fetch();

            $mediaTyp = match ($contentType) {
                'video'   => 'video',
                'podcast' => 'audio',
                'article' => 'image',
                default   => 'image',
            };

            $db->prepare(
                'INSERT INTO media (artwork_id, media_type, file_url, "order") VALUES (:aid, :type, :url, 0)'
            )->execute(['aid' => $artwork['id'], 'type' => $mediaTyp, 'url' => $mediaUrl]);

            $db->commit();
            Response::created($artwork, 'Post published');
        } catch (\Throwable $e) {
            $db->rollBack();
            throw $e;
        }
    }

    public function update(array $params): void
    {
        $artworkId = (int) $params['id'];
        $userId    = (int) $params['_user_id'];
        $body      = json_decode(file_get_contents('php://input') ?: '{}', true) ?? [];

        $db   = Database::getInstance();
        $stmt = $db->prepare('SELECT user_id FROM artworks WHERE id = :id');
        $stmt->execute(['id' => $artworkId]);
        $row = $stmt->fetch();

        if (!$row) {
            Response::error('Artwork not found', 404);
        }
        if ((int) $row['user_id'] !== $userId) {
            Response::error('Forbidden', 403);
        }

        $allowed = ['title', 'description', 'status'];
        $sets    = [];
        $binds   = ['id' => $artworkId];

        foreach ($allowed as $field) {
            if (array_key_exists($field, $body)) {
                $sets[]        = "\"{$field}\" = :{$field}";
                $binds[$field] = $body[$field];
            }
        }

        if (empty($sets)) {
            Response::error('No valid fields provided', 422);
        }

        $db->prepare('UPDATE artworks SET ' . implode(', ', $sets) . ' WHERE id = :id')
           ->execute($binds);

        $stmt = $db->prepare('SELECT id, title, description, status, created_at, published_at FROM artworks WHERE id = :id');
        $stmt->execute(['id' => $artworkId]);

        Response::ok($stmt->fetch());
    }

    public function destroy(array $params): void
    {
        $artworkId = (int) $params['id'];
        $userId    = (int) $params['_user_id'];

        $db   = Database::getInstance();
        $stmt = $db->prepare('SELECT user_id FROM artworks WHERE id = :id');
        $stmt->execute(['id' => $artworkId]);
        $row = $stmt->fetch();

        if (!$row) {
            Response::error('Artwork not found', 404);
        }
        if ((int) $row['user_id'] !== $userId) {
            Response::error('Forbidden', 403);
        }

        $db->prepare('DELETE FROM artworks WHERE id = :id')->execute(['id' => $artworkId]);

        Response::ok([], 'Artwork deleted');
    }
}
