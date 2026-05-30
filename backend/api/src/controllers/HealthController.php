<?php

declare(strict_types=1);

/** Public diagnostics — no auth. */
class HealthController
{
    /** GET /health — app + DB connectivity */
    public function ping(array $params): void
    {
        try {
            Database::getInstance()->query('SELECT 1');
            Response::ok(['app' => true, 'database' => true]);
        } catch (Throwable $e) {
            $out = ['app' => true, 'database' => false];
            if (getenv('DEBUG_ERRORS') === '1') {
                $out['detail'] = $e->getMessage();
            }
            Response::json(['error' => 'Database unreachable', 'data' => $out], 503);
        }
    }
}
