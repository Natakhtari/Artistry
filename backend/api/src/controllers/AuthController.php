<?php

declare(strict_types=1);

class AuthController
{
    // ── Public endpoints ───────────────────────────────────────────────────────

    public function register(array $params): void
    {
        $body = self::body();

        $username  = trim($body['username'] ?? '');
        $email     = strtolower(trim($body['email'] ?? ''));
        $password  = $body['password'] ?? '';
        $firstName = trim($body['first_name'] ?? '');
        $lastName  = trim($body['last_name'] ?? '');

        $errors = [];
        if (strlen($username) < 3 || strlen($username) > 150) {
            $errors['username'] = 'Must be 3–150 characters';
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = 'Invalid email address';
        }
        if (strlen($password) < 8) {
            $errors['password'] = 'Must be at least 8 characters';
        }
        if (strlen($password) > 72) {
            // bcrypt silently truncates at 72 bytes — reject instead of silently truncating
            $errors['password'] = 'Must be 72 characters or fewer';
        }
        if ($errors) {
            Response::validationError($errors);
        }

        $db = Database::getInstance();

        $check = $db->prepare('SELECT id FROM users WHERE email = :e OR username = :u LIMIT 1');
        $check->execute(['e' => $email, 'u' => $username]);
        if ($check->fetch()) {
            Response::error('Email or username already taken', 409);
        }

        $hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
        if ($hash === false) {
            Response::error('Password hashing failed', 500);
        }

        $stmt = $db->prepare(
            'INSERT INTO users (username, email, password_hash, first_name, last_name)
             VALUES (:u, :e, :h, :fn, :ln)
             RETURNING id, username, email, first_name, last_name, date_joined'
        );
        $stmt->execute([
            'u'  => $username,
            'e'  => $email,
            'h'  => $hash,
            'fn' => $firstName ?: null,
            'ln' => $lastName  ?: null,
        ]);
        $user = $stmt->fetch();

        [$accessToken, $refreshToken] = self::issueTokens((int) $user['id'], $user['username']);
        self::setRefreshCookie($refreshToken);

        Response::created([
            'access_token'  => $accessToken,
            'refresh_token' => $refreshToken,
            'user'          => $user,
        ], 'Account created');
    }

    public function login(array $params): void
    {
        $body     = self::body();
        $login    = trim($body['login'] ?? '');      // accepts email OR username
        $password = $body['password'] ?? '';

        if ($login === '' || $password === '') {
            Response::error('login and password are required', 422);
        }

        $db   = Database::getInstance();
        $stmt = $db->prepare(
            'SELECT id, username, email, password_hash, is_active
             FROM users
             WHERE email = :l OR username = :l
             LIMIT 1'
        );
        $stmt->execute(['l' => $login]);
        $user = $stmt->fetch();

        // Always run password_verify to prevent user-enumeration via timing
        $hash = $user['password_hash'] ?? '$2y$12$invalidhashXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
        if (!$user || !password_verify($password, $hash)) {
            Response::error('Invalid credentials', 401);
        }

        if (!(bool) $user['is_active']) {
            Response::error('This account is disabled', 403);
        }

        [$accessToken, $refreshToken] = self::issueTokens((int) $user['id'], $user['username']);
        self::setRefreshCookie($refreshToken);

        Response::ok([
            'access_token'  => $accessToken,
            'refresh_token' => $refreshToken,
            'user'          => [
                'id'       => $user['id'],
                'username' => $user['username'],
                'email'    => $user['email'],
            ],
        ]);
    }

    public function refresh(array $params): void
    {
        // Accept token from JSON body first, fall back to cookie
        $body  = json_decode(file_get_contents('php://input') ?: '{}', true) ?? [];
        $token = $body['refresh_token'] ?? $_COOKIE['refresh_token'] ?? null;
        if (!$token) {
            Response::error('No refresh token', 401);
        }

        $hash = hash('sha256', $token);
        $db   = Database::getInstance();

        $stmt = $db->prepare(
            'SELECT rt.user_id, u.username
             FROM refresh_tokens rt
             JOIN users u ON rt.user_id = u.id
             WHERE rt.token_hash = :h AND rt.expires_at > NOW()
             LIMIT 1'
        );
        $stmt->execute(['h' => $hash]);
        $row = $stmt->fetch();

        if (!$row) {
            Response::error('Refresh token invalid or expired', 401);
        }

        // Rotate: invalidate old token, issue new pair
        $db->prepare('DELETE FROM refresh_tokens WHERE token_hash = :h')->execute(['h' => $hash]);

        [$accessToken, $newRefresh] = self::issueTokens((int) $row['user_id'], $row['username']);
        self::setRefreshCookie($newRefresh);

        Response::ok(['access_token' => $accessToken, 'refresh_token' => $newRefresh]);
    }

    public function logout(array $params): void
    {
        $token = $_COOKIE['refresh_token'] ?? null;
        if ($token) {
            $hash = hash('sha256', $token);
            Database::getInstance()
                ->prepare('DELETE FROM refresh_tokens WHERE token_hash = :h')
                ->execute(['h' => $hash]);
        }

        setcookie('refresh_token', '', [
            'expires'  => time() - 3600,
            'path'     => '/api/auth',
            'httponly' => true,
            'samesite' => 'Strict',
        ]);

        Response::ok([], 'Logged out');
    }

    // ── Protected endpoint ─────────────────────────────────────────────────────

    public function me(array $params): void
    {
        $db   = Database::getInstance();
        $stmt = $db->prepare(
            'SELECT u.id, u.username, u.email, u.first_name, u.last_name,
                    u.is_staff, u.date_joined,
                    p.bio, p.profile_picture_url, p.cover_photo_url,
                    p.website_url, p.location
             FROM users u
             LEFT JOIN profiles p ON u.id = p.user_id
             WHERE u.id = :id'
        );
        $stmt->execute(['id' => $params['_user_id']]);
        $user = $stmt->fetch();

        if (!$user) {
            Response::error('User not found', 404);
        }

        Response::ok($user);
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private static function body(): array
    {
        return json_decode(file_get_contents('php://input') ?: '{}', true) ?? [];
    }

    /** Creates access + refresh token, persists refresh token hash. */
    private static function issueTokens(int $userId, string $username): array
    {
        $accessToken  = JWT::encode(['sub' => $userId, 'username' => $username], 7 * 24 * 3600);
        $refreshToken = bin2hex(random_bytes(32));  // 64-char hex string
        $hash         = hash('sha256', $refreshToken);

        Database::getInstance()
            ->prepare(
                "INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
                 VALUES (:uid, :h, NOW() + INTERVAL '7 days')"
            )
            ->execute(['uid' => $userId, 'h' => $hash]);

        return [$accessToken, $refreshToken];
    }

    /** Sends the refresh token as an HTTP-only cookie. */
    private static function setRefreshCookie(string $token): void
    {
        setcookie('refresh_token', $token, [
            'expires'  => time() + 7 * 24 * 3600,
            'path'     => '/api/auth',
            'httponly' => true,
            'secure'   => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
            'samesite' => 'Strict',
        ]);
    }
}
