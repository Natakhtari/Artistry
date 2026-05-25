<?php

declare(strict_types=1);

class FeedController
{
    public function index(array $params): void
    {
        $limit  = max(1, min(50, (int) ($_GET['limit']  ?? 20)));
        $offset = max(0,          (int) ($_GET['offset'] ?? 0));
        $userId = (int) $params['_user_id'];

        $db   = Database::getInstance();
        $stmt = $db->prepare('SELECT * FROM get_user_feed(:uid, :lim, :off)');
        $stmt->execute(['uid' => $userId, 'lim' => $limit, 'off' => $offset]);
        $rows = $stmt->fetchAll();

        Response::ok([
            'items'  => $rows,
            'limit'  => $limit,
            'offset' => $offset,
        ]);
    }
}
