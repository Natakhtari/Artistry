<?php

declare(strict_types=1);

/** Public diagnostics — no auth. */
class HealthController
{
    /** GET /health — liveness for Render (always HTTP 200 if PHP runs). DB status is in JSON. */
    public function ping(array $params): void
    {
        try {
            Database::getInstance()->query('SELECT 1');
            Response::ok(['app' => true, 'database' => true], 'OK');
        } catch (Throwable $e) {
            // Render (and most balancers) require 2xx on the health path — 503 blocks deploys.
            $out = ['app' => true, 'database' => false, 'degraded' => true];
            if (getenv('DEBUG_ERRORS') === '1') {
                $out['detail'] = $e->getMessage();
            }
            Response::ok($out, 'Database unreachable — check DB_* and DB_SSLMODE on Render');
        }
    }
}
