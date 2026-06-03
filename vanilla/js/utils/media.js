/**
 * Spotify page URLs are not playable in <audio>. Convert to embed iframe src.
 * Supports open.spotify.com/{track,album,playlist,episode}/{id}
 */
export function spotifyEmbedSrc(url) {
  if (!url || typeof url !== 'string') return null;
  const u = url.trim().replace(/^https?:\/\/(www\.)?spotify\.com\//i, 'https://open.spotify.com/');
  const m = u.match(
    /open\.spotify\.com\/(?:[\w-]+\/)*?(track|album|playlist|episode)\/([a-zA-Z0-9]+)/i
  );
  if (!m) return null;
  return `https://open.spotify.com/embed/${m[1].toLowerCase()}/${m[2]}?utm_source=generator`;
}

/** True if URL looks like a file the browser can play in <audio>. */
export function isDirectAudioUrl(url) {
  if (!url || typeof url !== 'string') return false;
  if (/\.(mp3|m4a|aac|ogg|wav|opus)(\?|#|$)/i.test(url)) return true;
  try {
    const h = new URL(url).hostname;
    if (h.includes('soundcloud.com')) return true;
  } catch {
    /* ignore */
  }
  return false;
}
