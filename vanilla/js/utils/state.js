const TOKEN_KEY   = 'artistry_token';
const REFRESH_KEY = 'artistry_refresh_token';
const USER_KEY    = 'artistry_user';

/** Parse JWT payload without verification (client-side expiry check only). */
function jwtExpiry(token) {
  try {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4 ? b64 + '===='.slice(b64.length % 4) : b64;
    return JSON.parse(atob(pad)).exp * 1000;
  } catch {
    return 0;
  }
}

function loadStorage() {
  try {
    const token        = localStorage.getItem(TOKEN_KEY);
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    const user         = JSON.parse(localStorage.getItem(USER_KEY) || 'null');
    if (token && jwtExpiry(token) > Date.now()) {
      return { token, refreshToken, user };
    }
    // Access token expired — keep refresh token so we can silently renew
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    return { token: null, refreshToken, user: null };
  } catch { /* localStorage unavailable */ }
  return { token: null, refreshToken: null, user: null };
}

class StateManager {
  constructor() {
    const { token, refreshToken, user } = loadStorage();

    this.state = {
      currentUser:    user,
      isAuthenticated: !!(token && user),
      token:          token,
      refreshToken:   refreshToken,
      likes:          {},
      savedPosts:     [],
      notifications:  [],
      currentRoute:   '/',
      modalState: {
        editProfile:      false,
        artworkLightbox:  false,
        selectedArtwork:  null,
      },
    };

    this.listeners = [];
  }

  // ── Core state ─────────────────────────────────────────────────────────────

  getState()  { return this.state; }

  setState(updates) {
    this.state = { ...this.state, ...updates };
    this.notify();
  }

  updateNested(path, value) {
    const keys = path.split('.');
    const next = { ...this.state };
    let cur = next;
    for (let i = 0; i < keys.length - 1; i++) {
      cur[keys[i]] = { ...cur[keys[i]] };
      cur = cur[keys[i]];
    }
    cur[keys[keys.length - 1]] = value;
    this.state = next;
    this.notify();
  }

  subscribe(fn) {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter(l => l !== fn); };
  }

  notify() {
    this.listeners.forEach(fn => fn(this.state));
  }

  // ── Auth ───────────────────────────────────────────────────────────────────

  getToken()        { return this.state.token; }
  getRefreshToken() { return this.state.refreshToken; }

  setToken(token) {
    this.state.token = token;
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else       localStorage.removeItem(TOKEN_KEY);
  }

  setRefreshToken(token) {
    this.state.refreshToken = token;
    if (token) localStorage.setItem(REFRESH_KEY, token);
    else       localStorage.removeItem(REFRESH_KEY);
  }

  /**
   * Accepts a raw user object from the API and normalises it into the shape
   * the rest of the app expects (user.name, user.avatar, etc.).
   */
  setUser(raw) {
    if (!raw) {
      this.state.currentUser    = null;
      this.state.isAuthenticated = false;
      localStorage.removeItem(USER_KEY);
      this.notify();
      return;
    }

    const user = {
      id:       raw.id,
      name:     [raw.first_name, raw.last_name].filter(Boolean).join(' ') || raw.username,
      username: '@' + raw.username.replace(/^@/, ''),
      email:    raw.email,
      avatar:   raw.profile_picture_url || null,
      bio:      raw.bio || '',
      // stats are loaded separately
      followers: raw.followers ?? 0,
      following:  raw.following ?? 0,
      artworks:   raw.artworks  ?? 0,
      _raw: raw,
    };

    this.state.currentUser    = user;
    this.state.isAuthenticated = true;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.notify();
  }

  clearAuth() {
    this.setToken(null);
    this.setRefreshToken(null);
    this.setUser(null);
  }

  // ── Likes ──────────────────────────────────────────────────────────────────

  toggleLike(artworkId, currentLikes) {
    const likes = { ...this.state.likes };
    const wasLiked = !!likes[artworkId];

    if (wasLiked) delete likes[artworkId];
    else          likes[artworkId] = true;

    this.setState({ likes });
    return { isLiked: !wasLiked, newLikes: wasLiked ? currentLikes - 1 : currentLikes + 1 };
  }

  // ── Saved posts ────────────────────────────────────────────────────────────

  savePost(postId) {
    const saved = [...this.state.savedPosts];
    const idx = saved.indexOf(postId);
    if (idx > -1) saved.splice(idx, 1);
    else          saved.push(postId);
    this.setState({ savedPosts: saved });
  }

  isPostSaved(postId) { return this.state.savedPosts.includes(postId); }
}

export const stateManager = new StateManager();
