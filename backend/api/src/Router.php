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
        $uri    = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);

        // Strip leading /api prefix if present
        $path = preg_replace('#^/api#', '', $uri) ?: '/';

        // Browser preflight — already handled in index.php but guard here too
        if ($method === 'OPTIONS') {
            http_response_code(204);
            exit;
        }

        foreach ($this->routes as $route) {
            if ($route['method'] !== $method) {
                continue;
            }

            $pattern = '#^' . preg_replace('/\{(\w+)\}/', '(?P<$1>[^/]+)', $route['path']) . '$#';

            if (!preg_match($pattern, $path, $matches)) {
                continue;
            }

            // Keep only named captures as route params
            $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);

            foreach ($route['middleware'] as $mw) {
                $mw($params);
            }

            call_user_func($route['handler'], $params);
            return;
        }

        Response::error('Route not found', 404);
    }

    private function add(string $method, string $path, callable $handler, array $middleware): void
    {
        $this->routes[] = compact('method', 'path', 'handler', 'middleware');
    }
}
