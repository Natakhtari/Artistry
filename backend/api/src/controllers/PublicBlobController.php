<?php

declare(strict_types=1);

/**
 * Serves image bytes stored in upload_blobs (public GET — used in <img src> on the feed).
 */
class PublicBlobController
{
    public function show(array $params): void
    {
        $id = (int) ($params['id'] ?? 0);
        if ($id < 1) {
            Response::error('Not found', 404);
        }

        $db   = Database::getInstance();
        $stmt = $db->prepare('SELECT mime_type, data FROM upload_blobs WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            Response::error('Not found', 404);
        }

        $mime = (string) $row['mime_type'];
        $data = $row['data'];

        while (ob_get_level() > 0) {
            ob_end_clean();
        }

        header('Content-Type: ' . $mime);
        header('Cache-Control: public, max-age=604800, immutable');
        header('X-Content-Type-Options: nosniff');

        if (is_resource($data)) {
            fpassthru($data);
        } else {
            echo $data;
        }
        exit;
    }
}
