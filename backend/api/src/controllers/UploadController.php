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

        $ext      = self::ALLOWED[$mime];
        $filename = bin2hex(random_bytes(16)) . '.' . $ext;
        $dir      = '/var/www/html/public/uploads/' . $userId;

        if (!is_dir($dir) && !mkdir($dir, 0755, true)) {
            Response::error('Failed to create upload directory', 500);
        }

        $dest = $dir . '/' . $filename;
        if (!move_uploaded_file($file['tmp_name'], $dest)) {
            Response::error('Failed to save file', 500);
        }

        $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
        $host   = $_SERVER['HTTP_HOST'] ?? 'localhost:8742';
        $url    = "{$scheme}://{$host}/uploads/{$userId}/{$filename}";

        Response::ok(['url' => $url, 'mime' => $mime], 'File uploaded');
    }
}
