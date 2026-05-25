<?php

declare(strict_types=1);

class TagController
{
    /** GET /tags */
    public function index(array $params): void
    {
        $db   = Database::getInstance();
        $stmt = $db->query(
            'SELECT t.id, t.name, t.slug,
                    COUNT(tg.tag_id) AS usage_count
             FROM tags t
             LEFT JOIN tagging tg ON t.id = tg.tag_id
             GROUP BY t.id
             ORDER BY usage_count DESC, t.name ASC
             LIMIT 200'
        );
        Response::ok(['items' => $stmt->fetchAll()]);
    }

    /** POST /tags  — auth; creates or returns existing */
    public function upsert(array $params): void
    {
        $body = json_decode(file_get_contents('php://input') ?: '{}', true) ?? [];
        $name = trim($body['name'] ?? '');
        if ($name === '') Response::validationError(['name' => 'Tag name is required']);
        if (strlen($name) > 60) Response::validationError(['name' => 'Tag name max 60 chars']);

        $slug = $this->makeSlug($name);
        $db   = Database::getInstance();
        $db->prepare('INSERT INTO tags (name, slug) VALUES (:n, :s) ON CONFLICT (slug) DO NOTHING')
           ->execute(['n' => $name, 's' => $slug]);

        $stmt = $db->prepare('SELECT id, name, slug FROM tags WHERE slug = :s');
        $stmt->execute(['s' => $slug]);
        Response::ok($stmt->fetch());
    }

    /** POST /artworks/{id}/tags  — auth */
    public function addToArtwork(array $params): void
    {
        $this->addTag($params, 'artwork', (int) $params['id']);
    }

    /** DELETE /artworks/{id}/tags/{tagId}  — auth */
    public function removeFromArtwork(array $params): void
    {
        $this->removeTag($params, 'artwork', (int) $params['id'], (int) $params['tagId']);
    }

    /** POST /blog-posts/{id}/tags  — auth */
    public function addToBlogPost(array $params): void
    {
        $this->addTag($params, 'blog_post', (int) $params['id']);
    }

    /** DELETE /blog-posts/{id}/tags/{tagId}  — auth */
    public function removeFromBlogPost(array $params): void
    {
        $this->removeTag($params, 'blog_post', (int) $params['id'], (int) $params['tagId']);
    }

    /** GET /tags/{slug}/artworks  — public */
    public function artworksByTag(array $params): void
    {
        $slug   = $params['slug'];
        $limit  = max(1, min(50, (int) ($_GET['limit']  ?? 20)));
        $offset = max(0,          (int) ($_GET['offset'] ?? 0));

        $db = Database::getInstance();
        $t  = $db->prepare('SELECT id FROM tags WHERE slug = :s');
        $t->execute(['s' => $slug]);
        $tag = $t->fetch();
        if (!$tag) Response::error('Tag not found', 404);

        $stmt = $db->prepare(
            'SELECT a.id, a.title, a.description, a.content_type, a.created_at,
                    m.file_url AS thumbnail,
                    (SELECT COUNT(*) FROM likes WHERE content_type = \'artwork\' AND object_id = a.id) AS likes_count,
                    u.id AS author_id, u.username,
                    p.profile_picture_url AS avatar
             FROM artworks a
             JOIN users u ON a.user_id = u.id
             LEFT JOIN profiles p ON u.id = p.user_id
             LEFT JOIN media m ON a.id = m.artwork_id AND m."order" = 0
             JOIN tagging tg ON tg.content_type = \'artwork\' AND tg.object_id = a.id
             WHERE tg.tag_id = :tid AND a.status = \'published\'
             ORDER BY a.created_at DESC
             LIMIT :lim OFFSET :off'
        );
        $stmt->execute(['tid' => $tag['id'], 'lim' => $limit, 'off' => $offset]);
        Response::ok(['tag' => $slug, 'items' => $stmt->fetchAll()]);
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private function makeSlug(string $name): string
    {
        return strtolower(trim(preg_replace('/[^a-zA-Z0-9]+/', '-', $name), '-')) ?: 'tag';
    }

    private function addTag(array $params, string $contentType, int $objectId): void
    {
        $body  = json_decode(file_get_contents('php://input') ?: '{}', true) ?? [];
        $tagId = (int) ($body['tag_id'] ?? 0);
        if (!$tagId) Response::validationError(['tag_id' => 'tag_id is required']);

        $db = Database::getInstance();
        $db->prepare(
            'INSERT INTO tagging (tag_id, content_type, object_id) VALUES (:tid, :ct, :oid) ON CONFLICT DO NOTHING'
        )->execute(['tid' => $tagId, 'ct' => $contentType, 'oid' => $objectId]);
        Response::ok([], 'Tag added');
    }

    private function removeTag(array $params, string $contentType, int $objectId, int $tagId): void
    {
        $db = Database::getInstance();
        $db->prepare(
            'DELETE FROM tagging WHERE tag_id = :tid AND content_type = :ct AND object_id = :oid'
        )->execute(['tid' => $tagId, 'ct' => $contentType, 'oid' => $objectId]);
        Response::ok([], 'Tag removed');
    }
}
