<?php

declare(strict_types=1);

class NotificationController
{
    /** GET /notifications/unread-count */
    public function unreadCount(array $params): void
    {
        $me = (int) $params['_user_id'];
        $db = Database::getInstance();
        try {
            $stmt = $db->prepare(
                'SELECT COUNT(*) FROM notifications WHERE user_id = :u AND read_at IS NULL'
            );
            $stmt->execute(['u' => $me]);
            $n = (int) $stmt->fetchColumn();
        } catch (Throwable $e) {
            error_log('NotificationController::unreadCount: ' . $e->getMessage());
            $n = 0;
        }
        Response::ok(['count' => $n]);
    }

    /** GET /notifications */
    public function index(array $params): void
    {
        $me     = (int) $params['_user_id'];
        $limit  = max(1, min(100, (int) ($_GET['limit']  ?? 40)));
        $offset = max(0,          (int) ($_GET['offset'] ?? 0));

        $db = Database::getInstance();
        try {
            $stmt = $db->prepare(
                'SELECT n.id, n.type, n.object_type, n.object_id, n.body_preview, n.read_at, n.created_at,
                        u.id AS actor_id, u.username AS actor_username,
                        p.profile_picture_url AS actor_avatar
                 FROM notifications n
                 JOIN users u ON u.id = n.actor_id
                 LEFT JOIN profiles p ON p.user_id = u.id
                 WHERE n.user_id = :me
                 ORDER BY n.created_at DESC
                 LIMIT :lim OFFSET :off'
            );
            $stmt->bindValue('me', $me, PDO::PARAM_INT);
            $stmt->bindValue('lim', $limit, PDO::PARAM_INT);
            $stmt->bindValue('off', $offset, PDO::PARAM_INT);
            $stmt->execute();
            $items = $stmt->fetchAll();
        } catch (Throwable $e) {
            error_log('NotificationController::index: ' . $e->getMessage());
            $items = [];
        }

        Response::ok(['items' => $items, 'limit' => $limit, 'offset' => $offset]);
    }

    /** POST /notifications/mark-read — mark all as read */
    public function markRead(array $params): void
    {
        $me = (int) $params['_user_id'];
        $db = Database::getInstance();
        try {
            $db->prepare(
                'UPDATE notifications SET read_at = NOW()
                 WHERE user_id = :u AND read_at IS NULL'
            )->execute(['u' => $me]);
        } catch (Throwable $e) {
            error_log('NotificationController::markRead: ' . $e->getMessage());
        }
        Response::ok([], 'Marked read');
    }

    /** DELETE /notifications/clear — delete all for current user */
    public function clear(array $params): void
    {
        $me = (int) $params['_user_id'];
        $db = Database::getInstance();
        try {
            $db->prepare('DELETE FROM notifications WHERE user_id = :u')->execute(['u' => $me]);
        } catch (Throwable $e) {
            error_log('NotificationController::clear: ' . $e->getMessage());
        }
        Response::ok([], 'Cleared');
    }

    /** DELETE /notifications/{id} */
    public function destroy(array $params): void
    {
        $me = (int) $params['_user_id'];
        $id = (int) $params['id'];
        $db = Database::getInstance();
        try {
            $stmt = $db->prepare('DELETE FROM notifications WHERE id = :id AND user_id = :u');
            $stmt->execute(['id' => $id, 'u' => $me]);
        } catch (Throwable $e) {
            error_log('NotificationController::destroy: ' . $e->getMessage());
        }
        Response::ok([], 'Deleted');
    }
}
