import { Component } from './Component.js';
import { stateManager } from '../utils/state.js';
import { api } from '../utils/api.js';
import { toast } from '../utils/toast.js';
import { router } from '../router.js';
import { spotifyEmbedSrc, isDirectAudioUrl } from '../utils/media.js';

export class ArtworkLightbox extends Component {
  constructor() {
    super('lightbox-container');
    this.artwork = null;
    this.comments = [];
    this.commentsLoaded = false;
  }

  setArtwork(artwork) {
    this.artwork = artwork;
    this.comments = [];
    this.commentsLoaded = false;
  }

  async loadComments() {
    if (this.commentsLoaded || !this.artwork?.id) return;
    try {
      const res = await api.comments.listForArtwork(this.artwork.id, { limit: 50 });
      this.commentsLoaded = true;
      const items = res?.data?.items ?? [];
      const container = document.getElementById('comments-container');
      const loading   = document.getElementById('comments-loading');
      if (loading) loading.remove();
      if (!container) return;
      container.innerHTML = '';
      items.forEach(c => container.appendChild(this.createComment(c)));
      if (items.length === 0) {
        container.innerHTML = '<p class="text-sm text-slate-500">No comments yet. Be the first!</p>';
      }
    } catch {
      const loading = document.getElementById('comments-loading');
      if (loading) loading.textContent = 'Could not load comments.';
    }
  }

  // ── Media builders ─────────────────────────────────────────────────────────

  _buildImageView() {
    const wrap = this.createElement('div', {
      className: 'flex items-center justify-center bg-slate-800/50 p-4 md:p-8'
    });
    const img = this.createElement('img', {
      src:       this.artwork.image,
      alt:       `${this.artwork.title} by ${this.artwork.artist}`,
      className: 'w-auto h-auto max-h-[48vh] md:max-h-[84vh] max-w-[90vw] md:max-w-[55vw] object-contain rounded-2xl shadow-2xl block'
    });
    wrap.appendChild(img);
    return wrap;
  }

  _buildVideoPlayer() {
    const wrap = this.createElement('div', {
      className: 'flex items-center justify-center bg-black w-full md:w-[60vw] flex-shrink-0'
    });
    const video = document.createElement('video');
    // Use the dedicated media file if available, fall back to the thumbnail
    video.src      = this.artwork.media_src || this.artwork.image || '';
    video.controls = true;
    video.autoplay = true;
    video.className = 'w-full max-h-[90vh] outline-none';
    wrap.appendChild(video);
    return wrap;
  }

  _buildAudioPlayer() {
    const wrap = this.createElement('div', {
      className: 'flex flex-col items-center justify-center gap-6 bg-gradient-to-br from-slate-900 to-slate-800 p-10 w-full md:w-[42vw] flex-shrink-0'
    });

    // Album / cover art (image row from API — not the Spotify / stream URL)
    const artWrap = this.createElement('div', {
      className: 'w-52 h-52 rounded-2xl overflow-hidden shadow-2xl bg-slate-700 flex items-center justify-center flex-shrink-0'
    });
    const coverSrc = this.artwork.thumbnail || this.artwork.image;
    if (coverSrc) {
      const img = this.createElement('img', {
        src: coverSrc,
        alt: `${this.artwork.title} cover art`,
        className: 'w-full h-full object-cover'
      });
      img.addEventListener('error', () => {
        img.remove();
        artWrap.appendChild(this.createIcon('mic', 'w-20 h-20 text-slate-500'));
      });
      artWrap.appendChild(img);
    } else {
      artWrap.appendChild(this.createIcon('mic', 'w-20 h-20 text-slate-500'));
    }

    const titleEl = this.createElement('h2', {
      className: 'text-xl font-bold text-center leading-snug'
    }, this.artwork.title);

    const artistEl = this.createElement('p', {
      className: 'text-slate-400 text-sm'
    }, this.artwork.artist);

    const src = this.artwork.media_src || '';
    const spotifySrc = spotifyEmbedSrc(src);

    if (spotifySrc) {
      const iframe = document.createElement('iframe');
      iframe.src             = spotifySrc;
      iframe.width            = '100%';
      iframe.height           = '152';
      iframe.style.border     = '0';
      iframe.setAttribute('allowfullscreen', '');
      iframe.setAttribute('loading', 'lazy');
      iframe.setAttribute('allow', 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture');
      iframe.title = 'Spotify embed';
      iframe.className = 'w-full max-w-md rounded-xl bg-black';

      const open = this.createElement('a', {
        href:        src,
        target:      '_blank',
        rel:         'noopener noreferrer',
        className:   'text-sm text-green-400 hover:underline',
      }, 'Open in Spotify');
      wrap.appendChild(artWrap);
      wrap.appendChild(titleEl);
      wrap.appendChild(artistEl);
      wrap.appendChild(iframe);
      wrap.appendChild(open);
      return wrap;
    }

    if (isDirectAudioUrl(src)) {
      const audio = document.createElement('audio');
      audio.src       = src;
      audio.controls  = true;
      audio.className = 'w-full mt-2 rounded-xl';
      wrap.appendChild(artWrap);
      wrap.appendChild(titleEl);
      wrap.appendChild(artistEl);
      wrap.appendChild(audio);
      return wrap;
    }

    const hint = this.createElement('p', {
      className: 'text-sm text-slate-400 text-center max-w-sm'
    }, 'This link cannot be played in the browser. Open it in the app or site where it is hosted.');
    const open = this.createElement('a', {
      href:        src || '#',
      target:      '_blank',
      rel:         'noopener noreferrer',
      className:   'text-primary hover:underline text-sm font-medium break-all px-2 text-center',
    }, src || 'No URL');
    wrap.appendChild(artWrap);
    wrap.appendChild(titleEl);
    wrap.appendChild(artistEl);
    wrap.appendChild(hint);
    wrap.appendChild(open);
    return wrap;
  }

  _buildArticleView() {
    const wrap = this.createElement('div', {
      className: 'flex-1 overflow-y-auto bg-slate-950 custom-scrollbar'
    });

    const inner = this.createElement('div', {
      className: 'max-w-2xl mx-auto p-8 space-y-6'
    });

    if (this.artwork.image) {
      const hero = this.createElement('div', {
        className: 'w-full h-56 rounded-2xl overflow-hidden bg-slate-800'
      });
      const heroImg = this.createElement('img', {
        src:       this.artwork.image,
        alt:       this.artwork.title,
        className: 'w-full h-full object-cover'
      });
      hero.appendChild(heroImg);
      inner.appendChild(hero);
    }

    inner.appendChild(this.createElement('h1', {
      className: 'text-3xl font-bold leading-tight'
    }, this.artwork.title));

    const meta = this.createElement('div', {
      className: 'flex items-center gap-3 text-sm text-slate-400 border-b border-slate-800 pb-4'
    });
    meta.appendChild(this.createElement('span', {}, `By ${this.artwork.artist}`));
    if (this.artwork.created_at) {
      meta.appendChild(this.createElement('span', {}, '·'));
      meta.appendChild(this.createElement('span', {},
        new Date(this.artwork.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
      ));
    }
    inner.appendChild(meta);

    if (this.artwork.description) {
      const paras = this.artwork.description.split(/\n+/);
      paras.forEach(text => {
        if (text.trim()) {
          inner.appendChild(this.createElement('p', {
            className: 'text-slate-300 leading-relaxed'
          }, text.trim()));
        }
      });
    }

    wrap.appendChild(inner);
    return wrap;
  }

  // ── Main render ────────────────────────────────────────────────────────────

  render() {
    if (!this.artwork) return this.createElement('div');

    const state   = stateManager.getState();
    const isLiked = state.likes[this.artwork.id] || false;
    const likes   = isLiked ? this.artwork.likes + 1 : this.artwork.likes;
    const type    = this.artwork.type || this.artwork.content_type || 'photo';

    const container = this.createElement('div', {
      className: 'fixed inset-0 z-[10001] animate-fade-in',
      id: 'lightbox-root'
    });

    const backdrop = this.createElement('div', {
      className: 'fixed inset-0 bg-black/95 z-[10001]'
    });
    backdrop.addEventListener('click', () => this.close());

    const contentWrapper = this.createElement('div', {
      className: 'fixed inset-0 z-[10001] flex items-center justify-center p-4 md:p-6'
    });
    contentWrapper.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) this.close();
    });

    const closeButton = this.createElement('button', {
      className: 'absolute top-4 right-4 md:top-6 md:right-6 p-3 bg-slate-900/80 hover:bg-slate-900 rounded-full transition-colors z-[10002]',
      id: 'lightbox-close-btn'
    });
    closeButton.addEventListener('click', (e) => {
      e.stopPropagation(); e.preventDefault(); this.close();
    });
    closeButton.appendChild(this.createIcon('x', 'w-6 h-6'));

    const content = this.createElement('div', {
      className: 'flex flex-col md:flex-row items-stretch max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl'
    });

    // Pick the correct media panel based on content type
    let mediaPanel;
    if (type === 'video') {
      mediaPanel = this._buildVideoPlayer();
    } else if (type === 'podcast') {
      mediaPanel = this._buildAudioPlayer();
    } else if (type === 'article') {
      mediaPanel = this._buildArticleView();
    } else {
      mediaPanel = this._buildImageView();
    }

    content.appendChild(mediaPanel);
    content.appendChild(this.createInfoPanel(likes, isLiked));
    contentWrapper.appendChild(closeButton);
    contentWrapper.appendChild(content);
    container.appendChild(backdrop);
    container.appendChild(contentWrapper);

    return container;
  }

  // ── Info panel (likes + comments — same for all types) ─────────────────────

  createInfoPanel(likes, isLiked) {
    const panel = this.createElement('div', {
      className: 'w-full md:w-96 md:flex-shrink-0 bg-slate-900/95 backdrop-blur-xl border-t md:border-t-0 md:border-l border-slate-800 flex flex-col overflow-hidden'
    });

    // Artist header
    const artistSection = this.createElement('div', {
      className: 'p-6 border-b border-slate-800'
    });
    const artistHeader = this.createElement('div', {
      className: 'flex items-center gap-3 mb-4'
    });

    const avatarContainer = this.createElement('div', {
      className: 'w-12 h-12 rounded-full border-2 border-slate-700 overflow-hidden bg-slate-700 flex-shrink-0 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-primary transition-all'
    });
    avatarContainer.addEventListener('click', () => this._goToProfile());

    const initials = (this.artwork.artist || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

    if (this.artwork.avatar) {
      const avatar = this.createElement('img', {
        src: this.artwork.avatar, alt: `Profile photo of ${this.artwork.artist}`,
        className: 'w-full h-full object-cover'
      });
      avatar.addEventListener('error', () => {
        avatar.remove();
        avatarContainer.textContent = initials;
        avatarContainer.classList.add('text-sm', 'font-bold', 'text-slate-300');
      });
      avatarContainer.appendChild(avatar);
    } else {
      avatarContainer.textContent = initials;
      avatarContainer.classList.add('text-sm', 'font-bold', 'text-slate-300');
    }

    const artistInfo = this.createElement('div', { className: 'flex-1 min-w-0' });
    const artistName = this.createElement('h3', {
      className: 'text-lg truncate cursor-pointer hover:text-primary transition-colors'
    }, this.artwork.artist);
    artistName.addEventListener('click', () => this._goToProfile());

    const timeAgo = this.createElement('p', { className: 'text-sm text-slate-400' },
      this.artwork.created_at
        ? new Date(this.artwork.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
        : ''
    );

    artistInfo.appendChild(artistName);
    artistInfo.appendChild(timeAgo);
    artistHeader.appendChild(avatarContainer);
    artistHeader.appendChild(artistInfo);

    artistSection.appendChild(artistHeader);
    artistSection.appendChild(this.createElement('h2', { className: 'text-xl mb-2' }, this.artwork.title));
    if (this.artwork.description) {
      artistSection.appendChild(this.createElement('p', {
        className: 'text-slate-400 text-sm leading-relaxed line-clamp-3'
      }, this.artwork.description));
    }

    // Actions row (like)
    const actionsSection = this.createElement('div', {
      className: 'p-6 border-b border-slate-800'
    });
    const actionsRow = this.createElement('div', { className: 'flex items-center gap-4' });

    const likeButton = this.createElement('button', {
      className: `flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
        isLiked ? 'text-red-500' : 'text-slate-400 hover:text-red-500 hover:bg-slate-800'
      }`,
      id: 'lightbox-like-btn'
    });
    likeButton.addEventListener('click', () => this.handleLike());
    likeButton.appendChild(this.createIcon('heart', `w-5 h-5 ${isLiked ? 'fill-current' : ''}`));
    likeButton.appendChild(this.createElement('span', { id: 'lightbox-likes' }, likes.toString()));

    actionsRow.appendChild(likeButton);
    actionsSection.appendChild(actionsRow);

    // Comments list
    const commentsSection = this.createElement('div', {
      className: 'flex-1 overflow-y-auto p-6 custom-scrollbar'
    });
    commentsSection.appendChild(this.createElement('h3', {
      className: 'text-sm text-slate-400 mb-4'
    }, 'Comments'));

    const commentsContainer = this.createElement('div', {
      className: 'space-y-4',
      id: 'comments-container'
    });
    commentsContainer.appendChild(this.createElement('p', {
      className: 'text-sm text-slate-500',
      id: 'comments-loading'
    }, 'Loading comments…'));
    commentsSection.appendChild(commentsContainer);

    // Comment input
    const inputSection = this.createElement('div', {
      className: 'p-4 border-t border-slate-800'
    });
    const inputRow = this.createElement('div', { className: 'flex gap-2' });

    const input = this.createElement('input', {
      type: 'text',
      placeholder: 'Add a comment...',
      className: 'flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:border-primary transition-colors text-sm',
      id: 'comment-input'
    });
    input.addEventListener('keypress', (e) => { if (e.key === 'Enter') this.postComment(); });

    const postButton = this.createElement('button', {
      className: 'px-4 py-2 bg-primary hover:bg-primary-hover rounded-xl transition-colors text-sm',
      id: 'lightbox-post-btn'
    }, 'Post');
    postButton.addEventListener('click', (e) => {
      e.stopPropagation(); e.preventDefault(); this.postComment();
    });

    inputRow.appendChild(input);
    inputRow.appendChild(postButton);
    inputSection.appendChild(inputRow);

    panel.appendChild(artistSection);
    panel.appendChild(actionsSection);
    panel.appendChild(commentsSection);
    panel.appendChild(inputSection);
    return panel;
  }

  // ── Like (reads count from DOM to avoid stale-closure bug) ─────────────────

  handleLike() {
    const likeEl  = document.getElementById('lightbox-likes');
    const likeBtn = document.getElementById('lightbox-like-btn');

    // Read the DISPLAYED count so we never use a stale closure value
    const currentCount = parseInt(likeEl?.textContent ?? '0', 10);
    const result = stateManager.toggleLike(this.artwork.id, currentCount);

    if (likeEl)  likeEl.textContent = result.newLikes.toString();
    if (likeBtn) {
      likeBtn.className = result.isLiked
        ? 'flex items-center gap-2 px-4 py-2 rounded-xl transition-all text-red-500'
        : 'flex items-center gap-2 px-4 py-2 rounded-xl transition-all text-slate-400 hover:text-red-500 hover:bg-slate-800';
    }

    // Mirror count + state on the feed card (if it's visible behind the overlay)
    this._syncFeedCard(this.artwork.id, result.newLikes, result.isLiked);

    if (stateManager.getToken()) {
      api.likes.toggle('artwork', this.artwork.id).then(res => {
        // Reconcile with authoritative server count
        const serverCount = res?.data?.like_count;
        if (serverCount !== undefined) {
          if (likeEl) likeEl.textContent = serverCount.toString();
          this._syncFeedCard(this.artwork.id, serverCount, result.isLiked);
        }
      }).catch(() => { /* non-fatal */ });
    }
  }

  // ── Comments ────────────────────────────────────────────────────────────────

  createComment(comment) {
    const username = comment.username ?? comment.user ?? 'Unknown';
    const bodyText = comment.body     ?? comment.text ?? '';
    const timeStr  = comment.created_at
      ? new Date(comment.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      : (comment.time ?? '');
    const avatarUrl = comment.avatar ?? null;

    const commentDiv = this.createElement('div', {
      className: 'flex gap-3 group',
      'data-comment-id': comment.id
    });

    const avatarContainer = this.createElement('div', {
      className: 'w-8 h-8 rounded-full flex-shrink-0 overflow-hidden bg-slate-700 flex items-center justify-center'
    });
    if (avatarUrl) {
      avatarContainer.appendChild(this.createElement('img', {
        src: avatarUrl, alt: `${username} avatar`, className: 'w-full h-full object-cover'
      }));
    } else {
      avatarContainer.textContent = username.charAt(0).toUpperCase();
      avatarContainer.classList.add('text-xs', 'font-bold', 'text-slate-300');
    }

    const commentContent = this.createElement('div', { className: 'flex-1 min-w-0' });
    const text = this.createElement('p', { className: 'text-sm' });
    const userLink = this.createElement('span', {
      className: 'font-medium cursor-pointer hover:text-primary transition-colors'
    }, username + ' ');
    userLink.addEventListener('click', () => {
      const raw = (comment.username || username || '').replace(/^@/, '');
      if (raw) { this.close(); router.navigate(`/user/${raw}`); }
    });
    text.appendChild(userLink);
    text.appendChild(this.createElement('span', { className: 'text-slate-400' }, bodyText));

    const footer = this.createElement('div', { className: 'flex items-center gap-3 mt-1' });
    footer.appendChild(this.createElement('span', { className: 'text-xs text-slate-500' }, timeStr));

    const state = stateManager.getState();
    const currentUser = state?.currentUser;
    if (currentUser && (comment.user_id === currentUser.id || comment.username === currentUser.username)) {
      const delBtn = this.createElement('button', {
        className: 'text-xs text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity'
      }, 'Delete');
      delBtn.addEventListener('click', () => this.deleteComment(comment.id, commentDiv));
      footer.appendChild(delBtn);
    }

    commentContent.appendChild(text);
    commentContent.appendChild(footer);
    commentDiv.appendChild(avatarContainer);
    commentDiv.appendChild(commentContent);
    return commentDiv;
  }

  async deleteComment(commentId, element) {
    try {
      await api.comments.remove(commentId);
      element.remove();
    } catch (err) {
      toast.show(err.message || 'Could not delete comment', 'error');
    }
  }

  async postComment() {
    const input   = document.getElementById('comment-input');
    const postBtn = document.getElementById('lightbox-post-btn');
    if (!input?.value.trim()) return;

    const text = input.value.trim();
    input.value = '';
    if (postBtn) postBtn.disabled = true;

    const state = stateManager.getState();
    if (!state?.currentUser) {
      toast.show('Sign in to leave a comment', 'error');
      input.value = text;
      if (postBtn) postBtn.disabled = false;
      return;
    }

    try {
      const res     = await api.comments.createForArtwork(this.artwork.id, { body: text });
      const comment = res?.data ?? {};
      const container = document.getElementById('comments-container');
      if (container) {
        const placeholder = container.querySelector('p');
        if (placeholder?.textContent.includes('No comments')) placeholder.remove();
        container.appendChild(this.createComment(comment));
        container.scrollTop = container.scrollHeight;
      }
    } catch (err) {
      toast.show(err.message || 'Could not post comment', 'error');
      input.value = text;
    } finally {
      if (postBtn) postBtn.disabled = false;
    }
  }

  // ── Feed card sync ─────────────────────────────────────────────────────────

  _syncFeedCard(id, count, isLiked) {
    const countEl = document.getElementById(`likes-${id}`);
    const btn     = document.getElementById(`like-btn-${id}`);
    if (countEl) countEl.textContent = String(count);
    if (btn) {
      btn.className = `flex items-center gap-1 transition-colors flex-shrink-0 ${
        isLiked ? 'text-red-500' : 'text-slate-400 hover:text-red-500'
      }`;
      // Update the heart SVG fill too
      const svg = btn.querySelector('svg');
      if (svg) svg.classList.toggle('fill-current', isLiked);
    }
  }

  // ── Navigation ──────────────────────────────────────────────────────────────

  _goToProfile() {
    const raw = (this.artwork?.username || this.artwork?.artist_username || '').replace(/^@/, '');
    if (raw) {
      this.close();
      router.navigate(`/user/${raw}`);
    }
  }

  // ── Mount / unmount ────────────────────────────────────────────────────────

  close() {
    const lightbox = document.getElementById('lightbox-root');
    if (lightbox) lightbox.remove();
    document.body.style.overflow = '';
    stateManager.updateNested('modalState.artworkLightbox', false);
    stateManager.updateNested('modalState.selectedArtwork', null);
  }

  mount() {
    let container = document.getElementById('lightbox-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'lightbox-container';
      document.body.appendChild(container);
    }
    container.innerHTML = '';
    document.body.style.overflow = 'hidden';
    container.appendChild(this.render());
    this.afterRender();
    this.loadComments();
  }
}
