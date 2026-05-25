<?php

declare(strict_types=1);

class JWT
{
    private static string $secret = '';

    public static function init(string $secret): void
    {
        self::$secret = $secret;
    }

    public static function encode(array $payload, int $ttlSeconds = 3600): string
    {
        $header  = self::b64e(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
        $payload = array_merge($payload, ['iat' => time(), 'exp' => time() + $ttlSeconds]);
        $payload = self::b64e(json_encode($payload));
        $sig     = self::b64e(hash_hmac('sha256', "{$header}.{$payload}", self::$secret, true));

        return "{$header}.{$payload}.{$sig}";
    }

    /** Returns the decoded payload or null if the token is invalid / expired. */
    public static function decode(string $token): ?array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }

        [$header, $payload, $sig] = $parts;

        $expected = self::b64e(hash_hmac('sha256', "{$header}.{$payload}", self::$secret, true));

        // Constant-time comparison prevents timing attacks
        if (!hash_equals($expected, $sig)) {
            return null;
        }

        $data = json_decode(self::b64d($payload), true);

        if (!is_array($data) || !isset($data['exp']) || $data['exp'] < time()) {
            return null;
        }

        return $data;
    }

    private static function b64e(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function b64d(string $data): string
    {
        $pad  = strlen($data) % 4;
        $data = $pad ? $data . str_repeat('=', 4 - $pad) : $data;
        return base64_decode(strtr($data, '-_', '+/'));
    }
}
