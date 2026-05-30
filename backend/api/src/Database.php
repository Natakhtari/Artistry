<?php

declare(strict_types=1);

class Database
{
    private static ?PDO $instance = null;

    public static function getInstance(): PDO
    {
        if (self::$instance === null) {
            $host = getenv('DB_HOST') ?: 'postgres';
            $port = getenv('DB_PORT') ?: '5432';
            $name = getenv('DB_NAME') ?: 'artistry';
            $user = getenv('DB_USER') ?: 'artistry';
            $pass = getenv('DB_PASS') ?: '';

            $dsn = "pgsql:host={$host};port={$port};dbname={$name}";

            // Neon, Supabase, and most cloud Postgres require TLS
            $sslMode = getenv('DB_SSLMODE') ?: '';
            if ($sslMode !== '') {
                $allowed = ['disable', 'allow', 'prefer', 'require', 'verify-ca', 'verify-full'];
                if (in_array($sslMode, $allowed, true)) {
                    $dsn .= ';sslmode=' . $sslMode;
                }
            }

            self::$instance = new PDO($dsn, $user, $pass, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
        }

        return self::$instance;
    }
}
