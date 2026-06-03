<?php

declare(strict_types=1);

class Response
{
    public static function json(mixed $data, int $status = 200): never
    {
        header('Content-Type: application/json; charset=UTF-8');
        http_response_code($status);
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    public static function ok(mixed $data, string $message = ''): never
    {
        $body = ['data' => $data];
        if ($message !== '') {
            $body['message'] = $message;
        }
        self::json($body, 200);
    }

    public static function created(mixed $data, string $message = ''): never
    {
        $body = ['data' => $data];
        if ($message !== '') {
            $body['message'] = $message;
        }
        self::json($body, 201);
    }

    public static function error(string $message, int $status = 400): never
    {
        self::json(['error' => $message], $status);
    }

    public static function validationError(array $errors): never
    {
        self::json(['errors' => $errors], 422);
    }
}
