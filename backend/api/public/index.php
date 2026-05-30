<?php

declare(strict_types=1);

// ── CORS ──────────────────────────────────────────────────────────────────────
$origin = getenv('CORS_ORIGIN') ?: 'http://localhost:8000';
header("Access-Control-Allow-Origin: {$origin}");
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ── Autoload (flat require — no Composer needed) ───────────────────────────────
$src = __DIR__ . '/../src';

require_once $src . '/Database.php';
require_once $src . '/JWT.php';
require_once $src . '/Response.php';
require_once $src . '/Router.php';
require_once $src . '/middleware/AuthMiddleware.php';
require_once $src . '/controllers/AuthController.php';
require_once $src . '/controllers/FeedController.php';
require_once $src . '/controllers/UserController.php';
require_once $src . '/controllers/ArtworkController.php';
require_once $src . '/controllers/LikeController.php';
require_once $src . '/controllers/UploadController.php';
require_once $src . '/controllers/CommentController.php';
require_once $src . '/controllers/BlogPostController.php';
require_once $src . '/controllers/TagController.php';
require_once $src . '/controllers/NewsController.php';
require_once $src . '/controllers/MessageController.php';

// ── Bootstrap ─────────────────────────────────────────────────────────────────
$jwtSecret = getenv('JWT_SECRET') ?: '';
if ($jwtSecret === '') {
    http_response_code(500);
    echo json_encode(['error' => 'JWT_SECRET is not configured']);
    exit;
}
JWT::init($jwtSecret);

// ── Error handler ─────────────────────────────────────────────────────────────
set_exception_handler(function (Throwable $e): void {
    error_log($e->getMessage() . "\n" . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
    exit;
});

// ── Middleware shorthand ───────────────────────────────────────────────────────
$auth = [AuthMiddleware::class, 'handle'];

// ── Routes ────────────────────────────────────────────────────────────────────
$router = new Router();

// Auth
$auth_c = new AuthController();
$router->post('/auth/register', [$auth_c, 'register']);
$router->post('/auth/login',    [$auth_c, 'login']);
$router->post('/auth/refresh',  [$auth_c, 'refresh']);
$router->post('/auth/logout',   [$auth_c, 'logout']);
$router->get( '/auth/me',       [$auth_c, 'me'],   [$auth]);

// Feed (requires auth)
$feed_c = new FeedController();
$router->get('/feed', [$feed_c, 'index'], [$auth]);

// Users
$user_c = new UserController();
$router->get(   '/users',                        [$user_c, 'index']);
$router->get(   '/users/by-username/{username}', [$user_c, 'showByUsername']);
$router->get(   '/users/{id}',                   [$user_c, 'show']);
$router->get(   '/users/{id}/stats',             [$user_c, 'stats']);
$router->post(  '/users/{id}/follow',  [$user_c, 'follow'],        [$auth]);
$router->put(   '/users/profile',      [$user_c, 'updateProfile'], [$auth]);

// Artworks
$artwork_c = new ArtworkController();
$router->get(   '/artworks',        [$artwork_c, 'index']);
$router->get(   '/artworks/{id}',   [$artwork_c, 'show']);
$router->post(  '/artworks',        [$artwork_c, 'store'],   [$auth]);
$router->put(   '/artworks/{id}',   [$artwork_c, 'update'],  [$auth]);
$router->delete('/artworks/{id}',   [$artwork_c, 'destroy'], [$auth]);

// Likes
$like_c = new LikeController();
$router->post('/likes', [$like_c, 'toggle'], [$auth]);

// File upload
$upload_c = new UploadController();
$router->post('/upload', [$upload_c, 'store'], [$auth]);

// Comments
$comment_c = new CommentController();
$router->get(   '/artworks/{id}/comments',     [$comment_c, 'listForArtwork']);
$router->post(  '/artworks/{id}/comments',     [$comment_c, 'createForArtwork'],  [$auth]);
$router->get(   '/blog-posts/{id}/comments',   [$comment_c, 'listForBlogPost']);
$router->post(  '/blog-posts/{id}/comments',   [$comment_c, 'createForBlogPost'], [$auth]);
$router->delete('/comments/{id}',              [$comment_c, 'destroy'],           [$auth]);

// Blog posts
$blog_c = new BlogPostController();
$router->get(   '/blog-posts',       [$blog_c, 'index']);
$router->get(   '/blog-posts/{id}',  [$blog_c, 'show']);
$router->post(  '/blog-posts',       [$blog_c, 'store'],   [$auth]);
$router->put(   '/blog-posts/{id}',  [$blog_c, 'update'],  [$auth]);
$router->delete('/blog-posts/{id}',  [$blog_c, 'destroy'], [$auth]);

// Tags
$tag_c = new TagController();
$router->get(   '/tags',                         [$tag_c, 'index']);
$router->post(  '/tags',                         [$tag_c, 'upsert'],             [$auth]);
$router->get(   '/tags/{slug}/artworks',         [$tag_c, 'artworksByTag']);
$router->post(  '/artworks/{id}/tags',           [$tag_c, 'addToArtwork'],       [$auth]);
$router->delete('/artworks/{id}/tags/{tagId}',   [$tag_c, 'removeFromArtwork'],  [$auth]);
$router->post(  '/blog-posts/{id}/tags',         [$tag_c, 'addToBlogPost'],      [$auth]);
$router->delete('/blog-posts/{id}/tags/{tagId}', [$tag_c, 'removeFromBlogPost'], [$auth]);

// News
$news_c = new NewsController();
$router->get('/news',            [$news_c, 'index']);
$router->get('/news/categories', [$news_c, 'categories']);

// Direct Messages
$msg_c = new MessageController();
$router->get( '/messages/conversations',        [$msg_c, 'conversations'], [$auth]);
$router->post('/messages/react/{messageId}',    [$msg_c, 'react'],         [$auth]);
$router->get( '/messages/{userId}',             [$msg_c, 'thread'],        [$auth]);
$router->post('/messages/{userId}',             [$msg_c, 'send'],          [$auth]);
$router->get( '/messages/{userId}/poll',        [$msg_c, 'poll'],          [$auth]);

// ── Dispatch ──────────────────────────────────────────────────────────────────
$router->dispatch();
