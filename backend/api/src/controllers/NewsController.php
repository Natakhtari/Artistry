<?php

declare(strict_types=1);

class NewsController
{
    /** GET /news */
    public function index(array $params): void
    {
        $limit    = max(1, min(50, (int) ($_GET['limit']    ?? 20)));
        $offset   = max(0,          (int) ($_GET['offset']   ?? 0));
        $category = isset($_GET['category']) ? trim($_GET['category']) : null;

        $db  = Database::getInstance();
        $sql = 'SELECT id, title, description, url, source_name, image_url,
                       category, published_at, fetched_at
                FROM news_articles
                WHERE 1=1';
        $binds = [];

        if ($category) {
            $sql .= ' AND category = :cat';
            $binds['cat'] = $category;
        }

        $sql .= ' ORDER BY COALESCE(published_at, fetched_at) DESC LIMIT :lim OFFSET :off';
        $binds['lim'] = $limit;
        $binds['off'] = $offset;

        $stmt = $db->prepare($sql);
        $stmt->execute($binds);
        Response::ok(['items' => $stmt->fetchAll(), 'limit' => $limit, 'offset' => $offset]);
    }

    /** GET /news/categories */
    public function categories(array $params): void
    {
        $db   = Database::getInstance();
        $stmt = $db->query('SELECT DISTINCT category FROM news_articles ORDER BY category');
        $cats = array_column($stmt->fetchAll(), 'category');
        Response::ok(['items' => $cats]);
    }
}
