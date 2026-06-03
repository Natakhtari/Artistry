<?php

declare(strict_types=1);

final class UploadUrlHelper
{
    /** Absolute origin for URLs returned to the client (Render: set PUBLIC_BASE_URL if Host/proto is wrong). */
    public static function publicOrigin(): string
    {
        $env = trim((string) (getenv('PUBLIC_BASE_URL') ?: ''));
        if ($env !== '') {
            return rtrim($env, '/');
        }

        $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
            || (isset($_SERVER['HTTP_X_FORWARDED_PROTO'])
                && strtolower((string) $_SERVER['HTTP_X_FORWARDED_PROTO']) === 'https');
        $scheme = $https ? 'https' : 'http';
        $host   = (string) ($_SERVER['HTTP_X_FORWARDED_HOST'] ?? $_SERVER['HTTP_HOST'] ?? 'localhost');

        return $scheme . '://' . $host;
    }

    /** e.g. https://api.example.com/api/files/42 */
    public static function blobFileUrl(int $blobId): string
    {
        return self::publicOrigin() . '/api/files/' . $blobId;
    }

    /** Legacy disk URL under /uploads/… */
    public static function diskFileUrl(int $userId, string $filename): string
    {
        $origin = self::publicOrigin();

        return $origin . '/uploads/' . $userId . '/' . $filename;
    }
}
