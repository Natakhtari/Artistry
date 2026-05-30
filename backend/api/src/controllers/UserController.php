<?php

declare(strict_types=1);

class UserController
{
    /** GET /users  — public; list of creators with follower counts */
    public function index(array $params): void
    {
        $limit  = max(1, min(50, (int) ($_GET['limit']  ?? 20)));
        $offset = max(0,          (int) ($_GET['offset'] ?? 0));

        $db   = Database::getInstance();
        $stmt = $db->prepare(
            'SELECT u.id, u.username,
                    TRIM(COALESCE(u.first_name,\'\') || \' \' || COALESCE(u.last_name,\'\')) AS display_name,
                    p.bio, p.profile_picture_url,
                    (SELECT COUNT(*) FROM follows WHERE following_id = u.id) AS followers_count,
                    (SELECT COUNT(*) FROM artworks a WHERE a.user_id = u.id AND a.status = \'published\') AS artworks_count
             FROM users u
             LEFT JOIN profiles p ON u.id = p.user_id
             WHERE u.is_active = TRUE
             ORDER BY followers_count DESC, artworks_count DESC
             LIMIT :lim OFFSET :off'
        );
        $stmt->execute(['lim' => $limit, 'off' => $offset]);
        Response::ok(['items' => $stmt->fetchAll()]);
    }

    public function show(array $params): void
    {
        $db   = Database::getInstance();
        $stmt = $db->prepare(
            'SELECT u.id, u.username, u.first_name, u.last_name,
                    p.bio, p.profile_picture_url, p.cover_photo_url,
                    p.website_url, p.location
             FROM users u
             LEFT JOIN profiles p ON u.id = p.user_id
             WHERE u.id = :id AND u.is_active = TRUE'
        );
        $stmt->execute(['id' => (int) $params['id']]);
        $user = $stmt->fetch();

        if (!$user) {
            Response::error('User not found', 404);
        }

        Response::ok($user);
    }

    public function showByUsername(array $params): void
    {
        $db   = Database::getInstance();
        $stmt = $db->prepare(
            'SELECT u.id, u.username, u.first_name, u.last_name,
                    p.bio, p.profile_picture_url, p.cover_photo_url,
                    p.website_url, p.location
             FROM users u
             LEFT JOIN profiles p ON u.id = p.user_id
             WHERE u.username = :username AND u.is_active = TRUE'
        );
        $stmt->execute(['username' => ltrim($params['username'], '@')]);
        $user = $stmt->fetch();

        if (!$user) {
            Response::error('User not found', 404);
        }

        Response::ok($user);
    }

    public function stats(array $params): void
    {
        $db   = Database::getInstance();
        $stmt = $db->prepare('SELECT * FROM get_artist_stats(:uid)');
        $stmt->execute(['uid' => (int) $params['id']]);
        $stats = $stmt->fetch();

        if (!$stats) {
            Response::error('User not found', 404);
        }

        Response::ok($stats);
    }

    public function follow(array $params): void
    {
        $followerId  = (int) $params['_user_id'];
        $followingId = (int) $params['id'];

        if ($followerId === $followingId) {
            Response::error('You cannot follow yourself', 422);
        }

        $db = Database::getInstance();

        // Check target user exists
        $check = $db->prepare('SELECT id FROM users WHERE id = :id AND is_active = TRUE');
        $check->execute(['id' => $followingId]);
        if (!$check->fetch()) {
            Response::error('User not found', 404);
        }

        // Toggle follow
        $exists = $db->prepare(
            'SELECT 1 FROM follows WHERE follower_id = :fr AND following_id = :fg'
        );
        $exists->execute(['fr' => $followerId, 'fg' => $followingId]);

        if ($exists->fetch()) {
            $db->prepare('DELETE FROM follows WHERE follower_id = :fr AND following_id = :fg')
               ->execute(['fr' => $followerId, 'fg' => $followingId]);

            Response::ok(['following' => false], 'Unfollowed');
        } else {
            $db->prepare('INSERT INTO follows (follower_id, following_id) VALUES (:fr, :fg)')
               ->execute(['fr' => $followerId, 'fg' => $followingId]);

            Response::ok(['following' => true], 'Following');
        }
    }

    public function updateProfile(array $params): void
    {
        $userId = (int) $params['_user_id'];
        $body   = json_decode(file_get_contents('php://input') ?: '{}', true) ?? [];

        $db = Database::getInstance();

        // ── Profile fields (profiles table) ───────────────────────────────────
        $profileFields = ['bio', 'profile_picture_url', 'cover_photo_url', 'website_url', 'location'];
        $profileSets   = [];
        $profileBinds  = ['uid' => $userId];

        foreach ($profileFields as $field) {
            if (array_key_exists($field, $body)) {
                $profileSets[]        = "\"{$field}\" = :{$field}";
                $profileBinds[$field] = $body[$field];
            }
        }

        if (!empty($profileSets)) {
            $db->prepare('UPDATE profiles SET ' . implode(', ', $profileSets) . ' WHERE user_id = :uid')
               ->execute($profileBinds);
        }

        // ── User name / username fields (users table) ──────────────────────────
        $userFields = ['first_name', 'last_name'];
        $userSets   = [];
        $userBinds  = ['uid' => $userId];

        foreach ($userFields as $field) {
            if (array_key_exists($field, $body)) {
                $userSets[]        = "\"{$field}\" = :{$field}";
                $userBinds[$field] = $body[$field] ?: null;
            }
        }

        // Username change: validate uniqueness first
        if (!empty($body['username'])) {
            $newUsername = trim((string) $body['username']);
            if (strlen($newUsername) < 3 || strlen($newUsername) > 150) {
                Response::error('Username must be 3–150 characters', 422);
            }
            if (!preg_match('/^[a-zA-Z0-9_.\-]+$/', $newUsername)) {
                Response::error('Username may only contain letters, numbers, _ . and -', 422);
            }
            $taken = $db->prepare('SELECT id FROM users WHERE username = :u AND id != :uid');
            $taken->execute(['u' => $newUsername, 'uid' => $userId]);
            if ($taken->fetch()) {
                Response::error('Username already taken', 409);
            }
            $userSets[]             = '"username" = :username';
            $userBinds['username']  = $newUsername;
        }

        if (!empty($userSets)) {
            $db->prepare('UPDATE users SET ' . implode(', ', $userSets) . ' WHERE id = :uid')
               ->execute($userBinds);
        }

        if (empty($profileSets) && empty($userSets)) {
            Response::error('No valid fields provided', 422);
        }

        // Return the fresh merged user + profile row
        $stmt = $db->prepare(
            'SELECT u.id, u.username, u.email, u.first_name, u.last_name,
                    p.bio, p.profile_picture_url, p.cover_photo_url, p.website_url, p.location
             FROM users u
             LEFT JOIN profiles p ON u.id = p.user_id
             WHERE u.id = :uid'
        );
        $stmt->execute(['uid' => $userId]);

        Response::ok($stmt->fetch());
    }
}
