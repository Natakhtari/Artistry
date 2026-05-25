<?php

declare(strict_types=1);

class AuthMiddleware
{
    /**
     * Validates the Bearer token and injects _user_id + _user into $params.
     * Terminates with 401 if the token is missing or invalid.
     */
    public static function handle(array &$params): void
    {
        // Apache may place the header in different places depending on config
        $header = $_SERVER['HTTP_AUTHORIZATION']
                ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
                ?? '';

        // Also check apache_request_headers() as a last resort
        if ($header === '' && function_exists('apache_request_headers')) {
            $apacheHeaders = apache_request_headers();
            $header = $apacheHeaders['Authorization'] ?? $apacheHeaders['authorization'] ?? '';
        }

        if (!preg_match('/^Bearer\s+(.+)$/i', $header, $m)) {
            Response::error('Unauthorized — missing token', 401);
        }

        $payload = JWT::decode(trim($m[1]));

        if ($payload === null) {
            Response::error('Unauthorized — invalid or expired token', 401);
        }

        $params['_user_id'] = $payload['sub'];
        $params['_user']    = $payload;
    }
}
