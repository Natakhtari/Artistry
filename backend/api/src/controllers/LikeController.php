<?php

declare(strict_types=1);

class LikeController
{
    private const ALLOWED_TYPES = ['artwork', 'blog_post'];

    public function toggle(array $params): void
    {
        $body = json_decode(file_get_contents('php://input') ?: '{}', true) ?? [];

        $contentType = $body['content_type'] ?? '';
        $objectId    = isset($body['object_id']) ? (int) $body['object_id'] : 0;
        $userId      = (int) $params['_user_id'];

        if (!in_array($contentType, self::ALLOWED_TYPES, true)) {
            Response::validationError([
                'content_type' => 'Must be one of: ' . implode(', ', self::ALLOWED_TYPES),
            ]);
        }
        if ($objectId <= 0) {
            Response::validationError(['object_id' => 'Must be a positive integer']);
        }

        $db   = Database::getInstance();
        $stmt = $db->prepare('SELECT toggle_like(:uid, :ct, :oid)');
        $stmt->execute(['uid' => $userId, 'ct' => $contentType, 'oid' => $objectId]);
        $result = $stmt->fetchColumn(); // 'liked' | 'unliked'

        // Notify content owner (likes only; un-like removes matching notification)
        $ownerStmt = $contentType === 'artwork'
            ? $db->prepare('SELECT user_id FROM artworks WHERE id = :id')
            : $db->prepare('SELECT user_id FROM blog_posts WHERE id = :id');
        $ownerStmt->execute(['id' => $objectId]);
        $ownerId = (int) ($ownerStmt->fetchColumn() ?: 0);
        if ($ownerId > 0) {
            if ($result === 'liked') {
                NotificationService::notify($db, $ownerId, $userId, 'like', $contentType, $objectId, null);
            } else {
                NotificationService::retractLike($db, $ownerId, $userId, $contentType, $objectId);
            }
        }

        // Return updated count
        $count = $db->prepare(
            'SELECT COUNT(*) FROM likes WHERE content_type = :ct AND object_id = :oid'
        );
        $count->execute(['ct' => $contentType, 'oid' => $objectId]);

        Response::ok([
            'action'       => $result,
            'liked'        => $result === 'liked',
            'content_type' => $contentType,
            'object_id'    => $objectId,
            'like_count'   => (int) $count->fetchColumn(),
        ]);
    }
}
