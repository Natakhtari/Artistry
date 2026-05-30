<?php

declare(strict_types=1);

class Router
{
    private array $routes = [];

    public function get(string $path, callable $handler, array $middleware = []): void
    {
        $this->add('GET', $path, $handler, $middleware);
    }

    public function post(string $path, callable $handler, array $middleware = []): void
    {
        $this->add('POST', $path, $handler, $middleware);
    }

    public function put(string $path, callable $handler, array $middleware = []): void
    {
        $this->add('PUT', $path, $handler, $middleware);
    }

    public function delete(string $path, callable $handler, array $middleware = []): void
    {
        $this->add('DELETE', $path, $handler, $middleware);
    }

    public function dispatch(): void
    {
        $method = $_SERVER['REQUEST_METHOD'];
        $rawUri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

        // Strip leading /api prefix (public API URL is /api/...)
        $stripped = preg_replace('#^/api#', '', $rawUri) ?: '/';
        $stripped = rtrim($stripped, '/') ?: '/';
        $rawNorm   = rtrim($rawUri, '/') ?: '/';

        // Try stripped path first, then raw (covers proxies / health checks that preserve /api)
        $pathInfo = isset($_SERVER['PATH_INFO']) ? (string) $_SERVER['PATH_INFO'] : '';
        $pathInfo = $pathInfo !== '' ? (rtrim($pathInfo, '/') ?: '/') : '';

        $candidates = [];
        foreach ([$stripped, $rawNorm, $pathInfo] as $p) {
            if ($p !== '' && !in_array($p, $candidates, true)) {
                $candidates[] = $p;
            }
        }

        // Browser preflight — already handled in index.php but guard here too
        if ($method === 'OPTIONS') {
            http_response_code(204);
            exit;
        }

        foreach ($candidates as $path) {
            foreach ($this->routes as $route) {
                if ($route['method'] !== $method) {
                    continue;
                }

                $pattern = '#^' . preg_replace('/\{(\w+)\}/', '(?P<$1>[^/]+)', $route['path']) . '$#';

                if (!preg_match($pattern, $path, $matches)) {
                    continue;
                }

                $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);

                foreach ($route['middleware'] as $mw) {
                    $mw($params);
                }

                call_user_func($route['handler'], $params);
                return;
            }
        }

        Response::error('Route not found', 404);
    }

    private function add(string $method, string $path, callable $handler, array $middleware): void
    {
        $this->routes[] = compact('method', 'path', 'handler', 'middleware');
    }
}
