<?php

declare(strict_types=1);

class NewsController
{
    /** GET /news — DB rows merged with RSS (+ optional NewsAPI when NEWS_API_KEY is set). */
    public function index(array $params): void
    {
        $limit    = max(1, min(50, (int) ($_GET['limit']    ?? 20)));
        $offset   = max(0,          (int) ($_GET['offset']   ?? 0));
        $category = isset($_GET['category']) ? trim($_GET['category']) : null;

        $db   = Database::getInstance();
        $pool = min(120, $limit + $offset + 50);

        $sql = 'SELECT id, title, description, url, source_name, image_url,
                       category, published_at, fetched_at
                FROM news_articles
                WHERE 1=1';
        $binds = [];

        if ($category) {
            $sql .= ' AND category = :cat';
            $binds['cat'] = $category;
        }

        $sql .= ' ORDER BY COALESCE(published_at, fetched_at) DESC LIMIT :lim OFFSET 0';
        $binds['lim'] = $pool;

        $stmt = $db->prepare($sql);
        $stmt->execute($binds);
        $merged = $stmt->fetchAll() ?: [];

        $seenUrl = [];
        foreach ($merged as $row) {
            $u = strtolower(trim((string) ($row['url'] ?? '')));
            if ($u !== '') {
                $seenUrl[$u] = true;
            }
        }

        $external = [];
        try {
            $external = array_merge(
                NewsRssAggregator::fetchItems(14),
                NewsRssAggregator::fetchNewsApi(12)
            );
        } catch (Throwable $e) {
            error_log('NewsController external: ' . $e->getMessage());
        }

        if ($category) {
            $want = strtolower($category);
            $external = array_values(array_filter(
                $external,
                static fn (array $r): bool => strtolower((string) ($r['category'] ?? '')) === $want
            ));
        }

        foreach ($external as $row) {
            $u = strtolower(trim((string) ($row['url'] ?? '')));
            if ($u === '' || isset($seenUrl[$u])) {
                continue;
            }
            unset($row['_external']);
            $merged[] = $row;
            $seenUrl[$u] = true;
        }

        usort($merged, static function (array $a, array $b): int {
            $ta = strtotime((string) ($a['published_at'] ?? $a['fetched_at'] ?? '')) ?: 0;
            $tb = strtotime((string) ($b['published_at'] ?? $b['fetched_at'] ?? '')) ?: 0;

            return $tb <=> $ta;
        });

        $items = array_slice($merged, $offset, $limit);

        Response::ok(['items' => $items, 'limit' => $limit, 'offset' => $offset]);
    }

    /** GET /news/categories */
    public function categories(array $params): void
    {
        $db   = Database::getInstance();
        $stmt = $db->query('SELECT DISTINCT category FROM news_articles WHERE category IS NOT NULL ORDER BY category');
        $cats = array_values(array_filter(array_column($stmt->fetchAll(), 'category')));

        $extras = ['ART', 'NEWS', 'CULTURE', 'DESIGN'];
        $items  = array_values(array_unique(array_merge($cats, $extras)));
        sort($items);

        Response::ok(['items' => $items]);
    }
}
