<?php

declare(strict_types=1);

/**
 * Inserts in-app notification rows. Failures are logged and swallowed so
 * core actions (like, message, …) still succeed if the table is missing.
 */
final class NotificationService
{
    public static function notify(
        \PDO $db,
        int $recipientId,
        int $actorId,
        string $type,
        ?string $objectType = null,
        ?int $objectId = null,
        ?string $bodyPreview = null
    ): void {
        if ($recipientId <= 0 || $actorId <= 0 || $recipientId === $actorId) {
            return;
        }
        try {
            $pv = null;
            if ($bodyPreview !== null && $bodyPreview !== '') {
                $pv = function_exists('mb_substr')
                    ? mb_substr($bodyPreview, 0, 240)
                    : substr($bodyPreview, 0, 240);
            }
            $stmt = $db->prepare(
                'INSERT INTO notifications (user_id, actor_id, type, object_type, object_id, body_preview)
                 VALUES (:uid, :aid, :t, :ot, :oid, :pv)'
            );
            $stmt->execute([
                'uid' => $recipientId,
                'aid' => $actorId,
                't'   => $type,
                'ot'  => $objectType,
                'oid' => $objectId,
                'pv'  => $pv,
            ]);
        } catch (Throwable $e) {
            error_log('NotificationService::notify: ' . $e->getMessage());
        }
    }

    /** Remove the matching like notification (user un-liked). */
    public static function retractLike(
        \PDO $db,
        int $recipientId,
        int $actorId,
        string $objectType,
        int $objectId
    ): void {
        try {
            $stmt = $db->prepare(
                'DELETE FROM notifications
                 WHERE user_id = :rid AND actor_id = :aid AND type = \'like\'
                   AND object_type = :ot AND object_id = :oid'
            );
            $stmt->execute([
                'rid' => $recipientId,
                'aid' => $actorId,
                'ot'  => $objectType,
                'oid' => $objectId,
            ]);
        } catch (Throwable $e) {
            error_log('NotificationService::retractLike: ' . $e->getMessage());
        }
    }

    public static function retractFollow(\PDO $db, int $followingId, int $followerId): void
    {
        try {
            $stmt = $db->prepare(
                'DELETE FROM notifications
                 WHERE user_id = :fid AND actor_id = :fr AND type = \'follow\''
            );
            $stmt->execute(['fid' => $followingId, 'fr' => $followerId]);
        } catch (Throwable $e) {
            error_log('NotificationService::retractFollow: ' . $e->getMessage());
        }
    }
}
