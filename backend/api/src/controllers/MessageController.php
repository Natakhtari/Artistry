<?php

declare(strict_types=1);

class MessageController
{
    /** GET /messages/conversations — auth */
    public function conversations(array $params): void
    {
        $userId = (int) $params['_user_id'];
        $db     = Database::getInstance();

        // One row per conversation: latest message + partner info + unread count
        // uid appears multiple times — repeat the binding value for each ? placeholder
        $stmt = $db->prepare(
            'WITH latest AS (
                 SELECT
                     LEAST(sender_id, recipient_id)    AS u_min,
                     GREATEST(sender_id, recipient_id) AS u_max,
                     MAX(id) AS last_id
                 FROM direct_messages
                 WHERE sender_id = ? OR recipient_id = ?
                 GROUP BY u_min, u_max
             )
             SELECT
                 CASE WHEN dm.sender_id = ? THEN dm.recipient_id ELSE dm.sender_id END AS partner_id,
                 u.username AS partner_username,
                 TRIM(COALESCE(u.first_name,\'\') || \' \' || COALESCE(u.last_name,\'\'))  AS partner_name,
                 p.profile_picture_url AS partner_avatar,
                 dm.body        AS last_body,
                 dm.created_at  AS last_at,
                 dm.sender_id   AS last_sender_id,
                 (SELECT COUNT(*) FROM direct_messages x
                  WHERE x.recipient_id = ?
                    AND x.sender_id = CASE WHEN dm.sender_id = ? THEN dm.recipient_id ELSE dm.sender_id END
                    AND x.read_at IS NULL) AS unread_count
             FROM latest
             JOIN direct_messages dm ON dm.id = latest.last_id
             JOIN users u ON u.id = CASE WHEN dm.sender_id = ? THEN dm.recipient_id ELSE dm.sender_id END
             LEFT JOIN profiles p ON p.user_id = u.id
             ORDER BY dm.created_at DESC'
        );
        $stmt->execute([$userId, $userId, $userId, $userId, $userId, $userId]);

        Response::ok(['items' => $stmt->fetchAll()]);
    }

    /** GET /messages/{userId} — auth; fetch thread */
    public function thread(array $params): void
    {
        $me        = (int) $params['_user_id'];
        $partnerId = (int) $params['userId'];
        $limit     = max(1, min(100, (int) ($_GET['limit']  ?? 50)));
        $before    = isset($_GET['before']) ? (int) $_GET['before'] : 2147483647;

        $db   = Database::getInstance();

        // Mark incoming messages as read
        $db->prepare(
            'UPDATE direct_messages SET read_at = NOW()
             WHERE sender_id = :pid AND recipient_id = :me AND read_at IS NULL'
        )->execute(['pid' => $partnerId, 'me' => $me]);

        $stmt = $db->prepare(
            'SELECT dm.id, dm.sender_id, dm.recipient_id, dm.body, dm.media_url, dm.media_type,
                    dm.read_at, dm.created_at,
                    u.username AS sender_username,
                    p.profile_picture_url AS sender_avatar,
                    (SELECT COUNT(*) FROM message_likes ml WHERE ml.message_id = dm.id) AS like_count,
                    EXISTS(SELECT 1 FROM message_likes ml WHERE ml.message_id = dm.id AND ml.user_id = :uid) AS liked_by_me
             FROM direct_messages dm
             JOIN users u ON u.id = dm.sender_id
             LEFT JOIN profiles p ON p.user_id = dm.sender_id
             WHERE ((dm.sender_id = :me  AND dm.recipient_id = :pid)
                 OR (dm.sender_id = :pid2 AND dm.recipient_id = :me2))
               AND dm.id < :before
             ORDER BY dm.created_at DESC
             LIMIT :lim'
        );
        $stmt->execute([
            'uid' => $me,
            'me'  => $me,  'pid' => $partnerId,
            'pid2'=> $partnerId, 'me2' => $me,
            'before' => $before, 'lim' => $limit,
        ]);

        $messages = array_reverse($stmt->fetchAll());
        Response::ok(['items' => $messages]);
    }

    /** POST /messages/{userId} — auth; send message (text and/or media) */
    public function send(array $params): void
    {
        $me        = (int) $params['_user_id'];
        $partnerId = (int) $params['userId'];
        $body      = json_decode(file_get_contents('php://input') ?: '{}', true) ?? [];
        $text      = trim($body['body'] ?? '');
        $mediaUrl  = trim($body['media_url'] ?? '');
        $mediaType = trim($body['media_type'] ?? '');   // 'image' | 'video'

        if ($text === '' && $mediaUrl === '') {
            Response::validationError(['body' => 'Message cannot be empty']);
        }
        if (strlen($text) > 4000) {
            Response::validationError(['body' => 'Message too long (max 4000 chars)']);
        }
        if ($me === $partnerId) {
            Response::error('Cannot message yourself', 422);
        }

        // Verify partner exists
        $db   = Database::getInstance();
        $chk  = $db->prepare('SELECT id FROM users WHERE id = :id AND is_active = true');
        $chk->execute(['id' => $partnerId]);
        if (!$chk->fetch()) Response::error('User not found', 404);

        $stmt = $db->prepare(
            'INSERT INTO direct_messages (sender_id, recipient_id, body, media_url, media_type)
             VALUES (:me, :pid, :body, :murl, :mtype)
             RETURNING id, sender_id, recipient_id, body, media_url, media_type, read_at, created_at'
        );
        $stmt->execute([
            'me'    => $me,
            'pid'   => $partnerId,
            'body'  => $text,
            'murl'  => $mediaUrl  ?: null,
            'mtype' => $mediaType ?: null,
        ]);
        $msg = $stmt->fetch();

        $msgId = (int) ($msg['id'] ?? 0);
        $preview = $text !== '' ? $text : (($mediaUrl !== '') ? 'Sent a photo' : 'Message');
        NotificationService::notify($db, $partnerId, $me, 'new_message', 'direct_message', $msgId > 0 ? $msgId : null, $preview);

        // Attach sender info for immediate render
        $u = $db->prepare('SELECT username, p.profile_picture_url AS avatar FROM users u LEFT JOIN profiles p ON p.user_id = u.id WHERE u.id = :id');
        $u->execute(['id' => $me]);
        $sender = $u->fetch();

        Response::created(array_merge($msg, [
            'sender_username' => $sender['username'],
            'sender_avatar'   => $sender['avatar'],
        ]), 'Sent');
    }

    /** POST /messages/react/{messageId} — auth; toggle ❤️ on a message */
    public function react(array $params): void
    {
        $me        = (int) $params['_user_id'];
        $messageId = (int) $params['messageId'];

        $db  = Database::getInstance();

        // Verify user is a participant in this message's conversation
        $chk = $db->prepare(
            'SELECT id FROM direct_messages
             WHERE id = :mid AND (sender_id = :me OR recipient_id = :me2)'
        );
        $chk->execute(['mid' => $messageId, 'me' => $me, 'me2' => $me]);
        if (!$chk->fetch()) Response::error('Message not found', 404);

        // Toggle like
        $del = $db->prepare('DELETE FROM message_likes WHERE message_id = :mid AND user_id = :uid');
        $del->execute(['mid' => $messageId, 'uid' => $me]);

        if ($del->rowCount() === 0) {
            // Was not liked — insert
            $db->prepare('INSERT INTO message_likes (message_id, user_id) VALUES (:mid, :uid)')
               ->execute(['mid' => $messageId, 'uid' => $me]);
            $liked = true;

            $senderStmt = $db->prepare('SELECT sender_id FROM direct_messages WHERE id = :mid');
            $senderStmt->execute(['mid' => $messageId]);
            $senderId = (int) ($senderStmt->fetchColumn() ?: 0);
            if ($senderId > 0 && $senderId !== $me) {
                NotificationService::notify($db, $senderId, $me, 'message_liked', 'direct_message', $messageId, null);
            }
        } else {
            $liked = false;
        }

        $cntStmt = $db->prepare('SELECT COUNT(*) AS c FROM message_likes WHERE message_id = :mid');
        $cntStmt->execute(['mid' => $messageId]);
        $count = (int) $cntStmt->fetchColumn();

        Response::ok(['liked' => $liked, 'like_count' => $count, 'message_id' => $messageId]);
    }

    /** GET /messages/poll/{userId}?after={id} — auth; long-ish poll for new messages */
    public function poll(array $params): void
    {
        $me        = (int) $params['_user_id'];
        $partnerId = (int) $params['userId'];
        $afterId   = max(0, (int) ($_GET['after'] ?? 0));

        $db   = Database::getInstance();

        // Mark incoming as read
        $db->prepare(
            'UPDATE direct_messages SET read_at = NOW()
             WHERE sender_id = :pid AND recipient_id = :me AND read_at IS NULL'
        )->execute(['pid' => $partnerId, 'me' => $me]);

        $stmt = $db->prepare(
            'SELECT dm.id, dm.sender_id, dm.recipient_id, dm.body, dm.media_url, dm.media_type,
                    dm.read_at, dm.created_at,
                    u.username AS sender_username,
                    p.profile_picture_url AS sender_avatar,
                    (SELECT COUNT(*) FROM message_likes ml WHERE ml.message_id = dm.id) AS like_count,
                    EXISTS(SELECT 1 FROM message_likes ml WHERE ml.message_id = dm.id AND ml.user_id = :uid) AS liked_by_me
             FROM direct_messages dm
             JOIN users u ON u.id = dm.sender_id
             LEFT JOIN profiles p ON p.user_id = dm.sender_id
             WHERE ((dm.sender_id = :me  AND dm.recipient_id = :pid)
                 OR (dm.sender_id = :pid2 AND dm.recipient_id = :me2))
               AND dm.id > :after
             ORDER BY dm.created_at ASC
             LIMIT 50'
        );
        $stmt->execute([
            'uid'  => $me,
            'me'   => $me, 'pid'  => $partnerId,
            'pid2' => $partnerId, 'me2' => $me,
            'after' => $afterId,
        ]);

        Response::ok(['items' => $stmt->fetchAll()]);
    }
}
