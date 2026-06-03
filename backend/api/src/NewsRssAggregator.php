<?php

declare(strict_types=1);

/**
 * Fetches art-related headlines from public RSS feeds (no API key).
 * Used by NewsController and merged with DB rows.
 */
final class NewsRssAggregator
{
    /** feed URL => display name */
    private const FEEDS = [
        'https://hyperallergic.com/feed/'      => 'Hyperallergic',
        'https://www.thisiscolossal.com/feed/' => 'Colossal',
    ];

    public static function fetchItems(int $perFeed = 12): array
    {
        $items = [];
        foreach (self::FEEDS as $feedUrl => $sourceName) {
            try {
                $raw = self::httpGet($feedUrl);
                if ($raw === null || $raw === '') {
                    continue;
                }
                $parsed = self::parseRss($raw, $sourceName, $perFeed);
                foreach ($parsed as $row) {
                    $items[] = $row;
                }
            } catch (Throwable $e) {
                error_log('NewsRssAggregator: ' . $feedUrl . ' — ' . $e->getMessage());
            }
        }
        return $items;
    }

    private static function httpGet(string $url): ?string
    {
        if (function_exists('curl_init')) {
            $ch = curl_init($url);
            if ($ch === false) {
                return null;
            }
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_TIMEOUT        => 12,
                CURLOPT_HTTPHEADER     => [
                    'User-Agent: ArtistryNews/1.0 (+https://github.com/artistry)',
                    'Accept: application/rss+xml, application/xml, text/xml, */*',
                ],
            ]);
            $body = curl_exec($ch);
            $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            if ($body === false || $code >= 400) {
                return null;
            }
            return $body;
        }

        $ctx = stream_context_create([
            'http' => [
                'timeout' => 12,
                'header'  => "User-Agent: ArtistryNews/1.0\r\nAccept: application/rss+xml, */*\r\n",
            ],
        ]);
        $body = @file_get_contents($url, false, $ctx);
        return $body === false ? null : $body;
    }

    /** @return list<array<string,mixed>> */
    private static function parseRss(string $xml, string $sourceName, int $limit): array
    {
        libxml_use_internal_errors(true);
        $sx = simplexml_load_string($xml, 'SimpleXMLElement', LIBXML_NOCDATA);
        if ($sx === false) {
            return [];
        }

        $sx->registerXPathNamespace('media', 'http://search.yahoo.com/mrss/');
        $sx->registerXPathNamespace('content', 'http://purl.org/rss/1.0/modules/content/');

        $out   = [];
        $items = $sx->channel->item ?? [];
        $n     = 0;
        foreach ($items as $item) {
            if ($n >= $limit) {
                break;
            }
            $title = trim((string) ($item->title ?? ''));
            $link  = trim((string) ($item->link ?? ''));
            if ($link === '' && isset($item->guid)) {
                $link = trim((string) $item->guid);
            }
            if ($title === '' || $link === '') {
                continue;
            }

            $desc = (string) ($item->description ?? '');
            $cenc = $item->children('http://purl.org/rss/1.0/modules/content/', true);
            if ($desc === '' && $cenc && isset($cenc->encoded)) {
                $desc = (string) $cenc->encoded;
            }
            $desc = html_entity_decode(strip_tags($desc), ENT_QUOTES | ENT_HTML5, 'UTF-8');
            $desc = preg_replace('/\s+/', ' ', $desc) ?? '';
            if (strlen($desc) > 420) {
                $desc = substr($desc, 0, 417) . '…';
            }

            $imageUrl = null;
            if (isset($item->enclosure)) {
                $mt = (string) ($item->enclosure->attributes()->type ?? '');
                if ($mt !== '' && str_starts_with($mt, 'image/')) {
                    $imageUrl = (string) ($item->enclosure->attributes()->url ?? '');
                }
            }
            if ($imageUrl === null || $imageUrl === '') {
                $thumbs = @$item->xpath('media:thumbnail');
                if ($thumbs && isset($thumbs[0]['url'])) {
                    $imageUrl = (string) $thumbs[0]['url'];
                }
            }

            $cat = 'ART';
            if (isset($item->category)) {
                $c = trim((string) $item->category);
                if ($c !== '') {
                    $cat = strtoupper(substr($c, 0, 48));
                }
            }

            $pub = null;
            if (isset($item->pubDate)) {
                $t = strtotime((string) $item->pubDate);
                if ($t !== false) {
                    $pub = gmdate('c', $t);
                }
            }

            $out[] = [
                'id'           => null,
                'title'        => $title,
                'description'  => $desc,
                'url'          => substr($link, 0, 500),
                'source_name'  => $sourceName,
                'image_url'    => $imageUrl ? substr($imageUrl, 0, 500) : null,
                'category'     => $cat,
                'published_at' => $pub,
                'fetched_at'   => gmdate('c'),
                '_external'    => true,
            ];
            $n++;
        }

        return $out;
    }

    /**
     * Optional NewsAPI.org (free dev tier — set NEWS_API_KEY on Render).
     * @return list<array<string,mixed>>
     */
    public static function fetchNewsApi(int $limit = 12): array
    {
        $key = trim((string) (getenv('NEWS_API_KEY') ?: ''));
        if ($key === '' || !function_exists('curl_init')) {
            return [];
        }

        $params = [
            'q'        => 'contemporary art OR museum exhibition OR digital illustration',
            'language' => 'en',
            'sortBy'   => 'publishedAt',
            'pageSize' => min(30, $limit),
        ];
        $url = 'https://newsapi.org/v2/everything?' . http_build_query($params);

        $ch = curl_init($url);
        if ($ch === false) {
            return [];
        }
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 12,
            CURLOPT_HTTPHEADER     => [
                'X-Api-Key: ' . $key,
                'User-Agent: ArtistryNews/1.0',
            ],
        ]);
        $raw = curl_exec($ch);
        curl_close($ch);
        if ($raw === false || $raw === '') {
            return [];
        }
        $json = json_decode($raw, true);
        if (!is_array($json) || ($json['status'] ?? '') !== 'ok' || empty($json['articles'])) {
            return [];
        }

        $out = [];
        foreach ($json['articles'] as $a) {
            $title = trim((string) ($a['title'] ?? ''));
            $link  = trim((string) ($a['url'] ?? ''));
            if ($title === '' || $link === '') {
                continue;
            }
            $desc = trim((string) ($a['description'] ?? ''));
            if (strlen($desc) > 420) {
                $desc = substr($desc, 0, 417) . '…';
            }
            $img = trim((string) ($a['urlToImage'] ?? ''));
            $pub = null;
            if (!empty($a['publishedAt'])) {
                $t = strtotime((string) $a['publishedAt']);
                if ($t !== false) {
                    $pub = gmdate('c', $t);
                }
            }
            $src = trim((string) ($a['source']['name'] ?? 'News'));
            $out[] = [
                'id'           => null,
                'title'        => $title,
                'description'  => $desc,
                'url'          => substr($link, 0, 500),
                'source_name'  => substr($src, 0, 100),
                'image_url'    => $img !== '' ? substr($img, 0, 500) : null,
                'category'     => 'NEWS',
                'published_at' => $pub,
                'fetched_at'   => gmdate('c'),
                '_external'    => true,
            ];
        }

        return $out;
    }
}
