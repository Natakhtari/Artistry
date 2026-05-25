<?php

declare(strict_types=1);

class CommentController
{
    /** GET /artworks/{id}/comments  — public */
    public function listForArtwork(array $params): void
    {
        $artworkId = (int) $params['id'];
        $limit     = max(1, min(100, (int) ($_GET['limit']  ?? 50)));
        $offset    = max(0,          (int) ($_GET['offset'] ?? 0));

        $db   = Database::getInstance();
        $stmt = $db->prepare(
            'SELECT c.id, c.body, c.created_at,
                    u.id AS user_id, u.username,
                    p.profile_picture_url AS avatar
             FROM comments c
             JOIN users u ON c.user_id = u.id
             LEFT JOIN profiles p ON u.id = p.user_id
             WHERE c.content_type = \'artwork\' AND c.object_id = :aid
               AND c.parent_comment_id IS NULL
             ORDER BY c.created_at ASC
             LIMIT :lim OFFSET :off'
        );
        $stmt->execute(['aid' => $artworkId, 'lim' => $limit, 'off' => $offset]);

        Response::ok(['items' => $stmt->fetchAll(), 'limit' => $limit, 'offset' => $offset]);
    }

    /** GET /blog-posts/{id}/comments  — public */
    public function listForBlogPost(array $params): void
    {
        $postId = (int) $params['id'];
        $limit  = max(1, min(100, (int) ($_GET['limit']  ?? 50)));
        $offset = max(0,          (int) ($_GET['offset'] ?? 0));

        $db   = Database::getInstance();
        $stmt = $db->prepare(
            'SELECT c.id, c.body, c.created_at,
                    u.id AS user_id, u.username,
                    p.profile_picture_url AS avatar
             FROM comments c
             JOIN users u ON c.user_id = u.id
             LEFT JOIN profiles p ON u.id = p.user_id
             WHERE c.content_type = \'blog_post\' AND c.object_id = :pid
               AND c.parent_comment_id IS NULL
             ORDER BY c.created_at ASC
             LIMIT :lim OFFSET :off'
        );
        $stmt->execute(['pid' => $postId, 'lim' => $limit, 'off' => $offset]);

        Response::ok(['items' => $stmt->fetchAll(), 'limit' => $limit, 'offset' => $offset]);
    }

    /** POST /artworks/{id}/comments  — auth */
    public function createForArtwork(array $params): void
    {
        $this->create($params, 'artwork', (int) $params['id']);
    }

    /** POST /blog-posts/{id}/comments  — auth */
    public function createForBlogPost(array $params): void
    {
        $this->create($params, 'blog_post', (int) $params['id']);
    }

    /** DELETE /comments/{id}  — auth, own comment only */
    public function destroy(array $params): void
    {
        $commentId = (int) $params['id'];
        $userId    = (int) $params['_user_id'];

        $db   = Database::getInstance();
        $stmt = $db->prepare('SELECT user_id FROM comments WHERE id = :id');
        $stmt->execute(['id' => $commentId]);
        $row = $stmt->fetch();

        if (!$row) {
            Response::error('Comment not found', 404);
        }
        if ((int) $row['user_id'] !== $userId) {
            Response::error('Forbidden', 403);
        }

        $db->prepare('DELETE FROM comments WHERE id = :id')->execute(['id' => $commentId]);
        Response::ok([], 'Comment deleted');
    }

    // ── shared ────────────────────────────────────────────────────────────────

    private function create(array $params, string $contentType, int $objectId): void
    {
        $userId = (int) $params['_user_id'];
        $body   = json_decode(file_get_contents('php://input') ?: '{}', true) ?? [];
        $text   = trim($body['body'] ?? '');

        if ($text === '') {
            Response::validationError(['body' => 'Comment cannot be empty']);
        }
        if (strlen($text) > 2000) {
            Response::validationError(['body' => 'Comment must be 2000 characters or fewer']);
        }

        $db   = Database::getInstance();
        $stmt = $db->prepare(
            'INSERT INTO comments (user_id, body, content_type, object_id)
             VALUES (:uid, :body, :ct, :oid)
             RETURNING id, body, created_at'
        );
        $stmt->execute(['uid' => $userId, 'body' => $text, 'ct' => $contentType, 'oid' => $objectId]);
        $comment = $stmt->fetch();

        // Attach author info so the frontend can render immediately
        $user = $db->prepare('SELECT u.username, p.profile_picture_url AS avatar FROM users u LEFT JOIN profiles p ON u.id = p.user_id WHERE u.id = :id');
        $user->execute(['id' => $userId]);
        $author = $user->fetch();

        Response::created(array_merge($comment, [
            'user_id'  => $userId,
            'username' => $author['username'],
            'avatar'   => $author['avatar'],
        ]), 'Comment posted');
    }
}
