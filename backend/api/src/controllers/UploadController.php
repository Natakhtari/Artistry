<?php

declare(strict_types=1);

class UploadController
{
    private const MAX_SIZE = 52_428_800; // 50 MB

    private const ALLOWED = [
        'image/jpeg'  => 'jpg',
        'image/png'   => 'png',
        'image/gif'   => 'gif',
        'image/webp'  => 'webp',
        'video/mp4'   => 'mp4',
        'video/webm'  => 'webm',
        'audio/mpeg'  => 'mp3',
        'audio/mp4'   => 'mp4',
        'audio/wav'   => 'wav',
        'audio/ogg'   => 'ogg',
    ];

    public function store(array $params): void
    {
        $userId = (int) $params['_user_id'];

        if (empty($_FILES['file'])) {
            Response::error('No file provided', 400);
        }

        $file = $_FILES['file'];

        if ($file['error'] !== UPLOAD_ERR_OK) {
            $messages = [
                UPLOAD_ERR_INI_SIZE   => 'File exceeds server upload limit',
                UPLOAD_ERR_FORM_SIZE  => 'File exceeds form upload limit',
                UPLOAD_ERR_PARTIAL    => 'File was only partially uploaded',
                UPLOAD_ERR_NO_FILE    => 'No file was uploaded',
                UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary folder',
                UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
            ];
            Response::error($messages[$file['error']] ?? 'Upload error', 400);
        }

        if ($file['size'] > self::MAX_SIZE) {
            Response::error('File too large (max 50 MB)', 422);
        }

        $mime = mime_content_type($file['tmp_name']);
        if (!isset(self::ALLOWED[$mime])) {
            Response::error('File type not allowed. Supported: images, video/mp4, video/webm, audio files', 422);
        }

        $ext = self::ALLOWED[$mime];

        // Images → Postgres bytea (survives container redeploys). Video/audio → disk (ephemeral on free hosts).
        if (str_starts_with($mime, 'image/')) {
            $url = $this->storeImageBlob($userId, $mime, $file['tmp_name']);
            if ($url !== null) {
                Response::ok(['url' => $url, 'mime' => $mime], 'File uploaded');
            }
        }

        $filename = bin2hex(random_bytes(16)) . '.' . $ext;
        $dir      = '/var/www/html/public/uploads/' . $userId;

        if (!is_dir($dir) && !mkdir($dir, 0755, true)) {
            Response::error('Failed to create upload directory', 500);
        }

        $dest = $dir . '/' . $filename;
        if (!move_uploaded_file($file['tmp_name'], $dest)) {
            Response::error('Failed to save file', 500);
        }

        $url = UploadUrlHelper::diskFileUrl($userId, $filename);

        Response::ok(['url' => $url, 'mime' => $mime], 'File uploaded');
    }

    /** @return ?string public URL or null to fall back to disk */
    private function storeImageBlob(int $userId, string $mime, string $tmpPath): ?string
    {
        $bytes = @file_get_contents($tmpPath);
        if ($bytes === false || $bytes === '') {
            return null;
        }

        try {
            $db   = Database::getInstance();
            $stmt = $db->prepare(
                'INSERT INTO upload_blobs (user_id, mime_type, data) VALUES (:uid, :mime, :data) RETURNING id'
            );
            $stmt->execute([
                'uid'  => $userId,
                'mime' => $mime,
                'data' => $bytes,
            ]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $id  = (int) ($row['id'] ?? 0);
            if ($id < 1) {
                return null;
            }

            return UploadUrlHelper::blobFileUrl($id);
        } catch (Throwable $e) {
            error_log('upload_blobs insert failed (run db/migrations/004_upload_blobs.sql): ' . $e->getMessage());

            return null;
        }
    }
}
