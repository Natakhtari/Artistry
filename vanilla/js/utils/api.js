import { stateManager } from './state.js';

/** Set `window.ARTISTRY_API_BASE` in index.html before the app module loads (e.g. `https://api.yoursite.com/api`). */
export const API_BASE =
  (typeof window !== 'undefined' && window.ARTISTRY_API_BASE) || 'http://localhost:8742/api';

/** Try to get a new access token using the stored refresh token. */
async function tryRefresh() {
  const refreshToken = stateManager.getRefreshToken();
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method:      'POST',
      credentials: 'include',
      headers:     { 'Content-Type': 'application/json' },
      body:        JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    const newAccess  = data?.data?.access_token;
    const newRefresh = data?.data?.refresh_token;
    if (newAccess) {
      stateManager.setToken(newAccess);
      if (newRefresh) stateManager.setRefreshToken(newRefresh);
      return true;
    }
  } catch { /* network error */ }
  return false;
}

function forceLogout() {
  stateManager.clearAuth();
  window.location.href = '/auth';
}

function buildError(data, status) {
  const message =
    data.error ||
    (data.errors ? Object.values(data.errors).join(', ') : null) ||
    `Request failed (${status})`;
  const err = new Error(message);
  err.status = status;
  err.data = data;
  return err;
}

/**
 * Core fetch wrapper.
 * - Attaches Authorization header when a token is in state.
 * - On 401: tries silent token-refresh once, then retries.
 *   If refresh also fails, clears auth and redirects to /auth.
 */
async function request(method, path, body = null, requireAuth = true, _retried = false) {
  const headers = { 'Content-Type': 'application/json' };

  if (requireAuth) {
    const token = stateManager.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const opts = { method, headers, credentials: 'include' };
  if (body !== null) opts.body = JSON.stringify(body);

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, opts);
  } catch {
    const err = new Error('Cannot reach the server. Is Docker running?');
    err.status = 0;
    throw err;
  }

  let data = {};
  try { data = await res.json(); } catch { /* empty body */ }

  if (!res.ok) {
    if (res.status === 401 && requireAuth && !_retried) {
      const refreshed = await tryRefresh();
      if (refreshed) return request(method, path, body, requireAuth, true);
      forceLogout();
      throw buildError(data, res.status);
    }
    if (res.status === 401 && requireAuth && _retried) {
      forceLogout();
      throw buildError(data, res.status);
    }
    throw buildError(data, res.status);
  }

  return data;
}

/**
 * Upload a File object. Returns { data: { url, mime } }.
 * Uses multipart/form-data — do NOT set Content-Type manually.
 * Auto-refreshes the token once on 401 before giving up.
 */
async function uploadFile(file, _retried = false) {
  const token = stateManager.getToken();
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const formData = new FormData();
  formData.append('file', file);

  let res;
  try {
    res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: formData,
    });
  } catch {
    const err = new Error('Cannot reach the server. Is Docker running?');
    err.status = 0;
    throw err;
  }

  let data = {};
  try { data = await res.json(); } catch { /* empty body */ }

  if (!res.ok) {
    if (res.status === 401 && !_retried) {
      const refreshed = await tryRefresh();
      if (refreshed) return uploadFile(file, true);
      forceLogout();
      throw buildError(data, res.status);
    }
    if (res.status === 401 && _retried) {
      forceLogout();
      throw buildError(data, res.status);
    }
    throw buildError(data, res.status);
  }

  return data;
}

export const api = {
  upload: uploadFile,

  feed: {
    list: (p = {}) => request('GET', `/feed?${new URLSearchParams(p)}`, null, true),
  },

  auth: {
    register: (body) => request('POST', '/auth/register', body, false),
    login:    (body) => request('POST', '/auth/login',    body, false),
    logout:   ()     => request('POST', '/auth/logout',   null, true),
    me:       ()     => request('GET',  '/auth/me',       null, true),
  },

  likes: {
    toggle: (contentType, objectId) =>
      request('POST', '/likes', { content_type: contentType, object_id: objectId }),
  },

  artworks: {
    create: (body)   => request('POST', '/artworks',        body),
    list:   (p = {}) => request('GET',  `/artworks?${new URLSearchParams(p)}`, null, false),
    show:   (id)     => request('GET',  `/artworks/${id}`,  null, false),
    update: (id, b)  => request('PUT',  `/artworks/${id}`,  b),
    remove: (id)     => request('DELETE', `/artworks/${id}`, null),
  },

  users: {
    list:            (p = {})   => request('GET',  `/users?${new URLSearchParams(p)}`, null, false),
    show:            (id)       => request('GET',  `/users/${id}`,                    null, false),
    showByUsername:  (username) => request('GET',  `/users/by-username/${encodeURIComponent(username)}`, null, false),
    stats:           (id)       => request('GET',  `/users/${id}/stats`,              null, false),
    follow:          (id)       => request('POST', `/users/${id}/follow`),
    updateProfile:   (body)     => request('PUT',  '/users/profile',                  body),
  },

  comments: {
    listForArtwork:  (artworkId, p = {}) => request('GET',  `/artworks/${artworkId}/comments?${new URLSearchParams(p)}`, null, false),
    listForBlogPost: (postId,    p = {}) => request('GET',  `/blog-posts/${postId}/comments?${new URLSearchParams(p)}`,  null, false),
    createForArtwork:  (artworkId, body) => request('POST', `/artworks/${artworkId}/comments`,   body),
    createForBlogPost: (postId,    body) => request('POST', `/blog-posts/${postId}/comments`,    body),
    remove:          (commentId)         => request('DELETE', `/comments/${commentId}`,          null),
  },

  blogPosts: {
    list:   (p = {}) => request('GET',  `/blog-posts?${new URLSearchParams(p)}`, null, false),
    show:   (id)     => request('GET',  `/blog-posts/${id}`,                     null, false),
    create: (body)   => request('POST', '/blog-posts',                           body),
    update: (id, b)  => request('PUT',  `/blog-posts/${id}`,                     b),
    remove: (id)     => request('DELETE', `/blog-posts/${id}`,                   null),
  },

  tags: {
    list:              ()                    => request('GET',    '/tags',                            null, false),
    upsert:            (name)                => request('POST',   '/tags',                            { name }),
    artworksByTag:     (slug, p = {})        => request('GET',    `/tags/${slug}/artworks?${new URLSearchParams(p)}`, null, false),
    addToArtwork:      (artworkId, tagId)    => request('POST',   `/artworks/${artworkId}/tags`,      { tag_id: tagId }),
    removeFromArtwork: (artworkId, tagId)    => request('DELETE', `/artworks/${artworkId}/tags/${tagId}`, null),
    addToBlogPost:     (postId,    tagId)    => request('POST',   `/blog-posts/${postId}/tags`,       { tag_id: tagId }),
    removeFromBlogPost:(postId,    tagId)    => request('DELETE', `/blog-posts/${postId}/tags/${tagId}`, null),
  },

  news: {
    list:       (p = {}) => request('GET', `/news?${new URLSearchParams(p)}`,    null, false),
    categories: ()       => request('GET', '/news/categories',                   null, false),
  },

  messages: {
    conversations: ()               => request('GET',  '/messages/conversations',              null, true),
    thread:        (userId, p={})   => request('GET',  `/messages/${userId}?${new URLSearchParams(p)}`, null, true),
    send:          (userId, body)   => request('POST', `/messages/${userId}`,                  body, true),
    poll:          (userId, afterId)=> request('GET',  `/messages/${userId}/poll?after=${afterId}`, null, true),
    react:         (messageId)      => request('POST', `/messages/react/${messageId}`,         null, true),
  },
};
