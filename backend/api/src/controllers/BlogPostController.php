<?php

declare(strict_types=1);

class BlogPostController
{
    /** GET /blog-posts */
    public function index(array $params): void
    {
        $limit  = max(1, min(50, (int) ($_GET['limit']   ?? 20)));
        $offset = max(0,          (int) ($_GET['offset']  ?? 0));
        $userId = isset($_GET['user_id']) ? (int) $_GET['user_id'] : null;

        $db  = Database::getInstance();
        $sql = 'SELECT bp.id, bp.title, bp.slug, bp.body, bp.featured_image_url,
                       bp.status, bp.created_at, bp.published_at,
                       u.id AS author_id, u.username AS author_username,
                       p.profile_picture_url AS author_avatar,
                       (SELECT COUNT(*) FROM comments c WHERE c.content_type = \'blog_post\' AND c.object_id = bp.id) AS comments_count,
                       (SELECT COUNT(*) FROM likes l WHERE l.content_type = \'blog_post\' AND l.object_id = bp.id) AS likes_count,
                       (SELECT json_agg(t.name) FROM tags t JOIN tagging tg ON t.id = tg.tag_id WHERE tg.content_type = \'blog_post\' AND tg.object_id = bp.id) AS tags
                FROM blog_posts bp
                JOIN users u ON bp.user_id = u.id
                LEFT JOIN profiles p ON u.id = p.user_id
                WHERE bp.status = \'published\'';

        $binds = [];
        if ($userId !== null) {
            $sql .= ' AND bp.user_id = :uid';
            $binds['uid'] = $userId;
        }

        $sql .= ' ORDER BY bp.created_at DESC LIMIT :lim OFFSET :off';
        $binds['lim'] = $limit;
        $binds['off'] = $offset;

        $stmt = $db->prepare($sql);
        $stmt->execute($binds);
        $items = $stmt->fetchAll();

        foreach ($items as &$item) {
            $item['tags'] = json_decode($item['tags'] ?? 'null', true) ?? [];
        }

        Response::ok(['items' => $items, 'limit' => $limit, 'offset' => $offset]);
    }

    /** GET /blog-posts/{id} */
    public function show(array $params): void
    {
        $db   = Database::getInstance();
        $stmt = $db->prepare(
            'SELECT bp.id, bp.title, bp.slug, bp.body, bp.featured_image_url,
                    bp.status, bp.created_at, bp.published_at,
                    u.id AS author_id, u.username AS author_username,
                    p.profile_picture_url AS author_avatar,
                    (SELECT COUNT(*) FROM comments c WHERE c.content_type = \'blog_post\' AND c.object_id = bp.id) AS comments_count,
                    (SELECT COUNT(*) FROM likes l WHERE l.content_type = \'blog_post\' AND l.object_id = bp.id) AS likes_count,
                    (SELECT json_agg(t.name) FROM tags t JOIN tagging tg ON t.id = tg.tag_id WHERE tg.content_type = \'blog_post\' AND tg.object_id = bp.id) AS tags
             FROM blog_posts bp
             JOIN users u ON bp.user_id = u.id
             LEFT JOIN profiles p ON u.id = p.user_id
             WHERE bp.id = :id AND bp.status = \'published\''
        );
        $stmt->execute(['id' => (int) $params['id']]);
        $post = $stmt->fetch();

        if (!$post) Response::error('Post not found', 404);

        $post['tags'] = json_decode($post['tags'] ?? 'null', true) ?? [];
        Response::ok($post);
    }

    /** POST /blog-posts  — auth */
    public function store(array $params): void
    {
        $userId = (int) $params['_user_id'];
        $body   = json_decode(file_get_contents('php://input') ?: '{}', true) ?? [];

        $title       = trim($body['title']             ?? '');
        $postBody    = trim($body['body']               ?? '');
        $imageUrl    = trim($body['featured_image_url'] ?? '');
        $status      = in_array($body['status'] ?? 'published', ['draft', 'published'], true)
                       ? $body['status'] : 'published';
        $tagNames    = array_filter(array_map('trim', (array) ($body['tags'] ?? [])));

        if ($title === '')    Response::validationError(['title' => 'Title is required']);
        if ($postBody === '') Response::validationError(['body'  => 'Body is required']);

        $slug = $this->makeSlug($title);

        $db = Database::getInstance();
        $db->beginTransaction();
        try {
            // Ensure slug uniqueness
            $base = $slug;
            $n    = 1;
            while (true) {
                $s = $db->prepare('SELECT id FROM blog_posts WHERE slug = :s');
                $s->execute(['s' => $slug]);
                if (!$s->fetch()) break;
                $slug = $base . '-' . $n++;
            }

            $stmt = $db->prepare(
                'INSERT INTO blog_posts (user_id, title, slug, body, featured_image_url, status)
                 VALUES (:uid, :title, :slug, :body, :img, :status)
                 RETURNING id, title, slug, body, featured_image_url, status, created_at'
            );
            $stmt->execute([
                'uid'    => $userId,
                'title'  => $title,
                'slug'   => $slug,
                'body'   => $postBody,
                'img'    => $imageUrl ?: null,
                'status' => $status,
            ]);
            $post = $stmt->fetch();

            $this->attachTags($db, $tagNames, 'blog_post', (int) $post['id']);

            $db->commit();
            Response::created($post, 'Article published');
        } catch (\Throwable $e) {
            $db->rollBack();
            throw $e;
        }
    }

    /** PUT /blog-posts/{id}  — auth */
    public function update(array $params): void
    {
        $postId = (int) $params['id'];
        $userId = (int) $params['_user_id'];
        $body   = json_decode(file_get_contents('php://input') ?: '{}', true) ?? [];

        $db   = Database::getInstance();
        $row  = $db->prepare('SELECT user_id FROM blog_posts WHERE id = :id');
        $row->execute(['id' => $postId]);
        $post = $row->fetch();
        if (!$post)                         Response::error('Post not found', 404);
        if ((int) $post['user_id'] !== $userId) Response::error('Forbidden', 403);

        $allowed = ['title', 'body', 'featured_image_url', 'status'];
        $sets = []; $binds = ['id' => $postId];
        foreach ($allowed as $f) {
            if (array_key_exists($f, $body)) {
                $sets[]     = "\"{$f}\" = :{$f}";
                $binds[$f]  = $body[$f];
            }
        }
        if (empty($sets)) Response::error('No valid fields', 422);

        $db->prepare('UPDATE blog_posts SET ' . implode(', ', $sets) . ' WHERE id = :id')->execute($binds);

        if (isset($body['tags'])) {
            $db->prepare('DELETE FROM tagging WHERE content_type = \'blog_post\' AND object_id = :id')->execute(['id' => $postId]);
            $tagNames = array_filter(array_map('trim', (array) $body['tags']));
            $this->attachTags($db, $tagNames, 'blog_post', $postId);
        }

        Response::ok($this->show(['id' => $postId]), 'Post updated');
    }

    /** DELETE /blog-posts/{id}  — auth */
    public function destroy(array $params): void
    {
        $postId = (int) $params['id'];
        $userId = (int) $params['_user_id'];

        $db  = Database::getInstance();
        $row = $db->prepare('SELECT user_id FROM blog_posts WHERE id = :id');
        $row->execute(['id' => $postId]);
        $post = $row->fetch();
        if (!$post)                         Response::error('Post not found', 404);
        if ((int) $post['user_id'] !== $userId) Response::error('Forbidden', 403);

        $db->prepare('DELETE FROM blog_posts WHERE id = :id')->execute(['id' => $postId]);
        Response::ok([], 'Post deleted');
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private function makeSlug(string $title): string
    {
        $slug = strtolower(trim(preg_replace('/[^a-zA-Z0-9]+/', '-', $title), '-'));
        return $slug ?: 'post';
    }

    private function attachTags(\PDO $db, array $names, string $contentType, int $objectId): void
    {
        foreach ($names as $name) {
            if ($name === '') continue;
            // Upsert tag
            $db->prepare('INSERT INTO tags (name, slug) VALUES (:n, :s) ON CONFLICT (slug) DO NOTHING')
               ->execute(['n' => $name, 's' => $this->makeSlug($name)]);
            $t = $db->prepare('SELECT id FROM tags WHERE slug = :s');
            $t->execute(['s' => $this->makeSlug($name)]);
            $tag = $t->fetch();
            if (!$tag) continue;
            $db->prepare('INSERT INTO tagging (tag_id, content_type, object_id) VALUES (:tid, :ct, :oid) ON CONFLICT DO NOTHING')
               ->execute(['tid' => $tag['id'], 'ct' => $contentType, 'oid' => $objectId]);
        }
    }
}
