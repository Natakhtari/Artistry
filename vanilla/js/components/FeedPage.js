import { Component } from './Component.js';
import { stateManager } from '../utils/state.js';
import { router } from '../router.js';
import { api } from '../utils/api.js';
import { toast } from '../utils/toast.js';

const PAGE_SIZE = 20;

function normalize(a) {
  const name = (a.artist_name || '').trim() || a.artist_username || 'Unknown';
  return {
    id:          a.id,
    type:        a.content_type || 'photo',
    title:       a.title        || 'Untitled',
    description: a.description  || '',
    artist:      name,
    username:    a.artist_username || '',
    avatar:      a.artist_avatar   || null,
    image:       a.thumbnail       || null,   // thumbnail for feed card
    thumbnail:   a.thumbnail       || null,
    media_src:   a.media_src       || null,   // actual video/audio file URL
    created_at:  a.created_at      || null,
    likes:       Number(a.likes_count)    || 0,
    comments:    Number(a.comments_count) || 0,
  };
}

export class FeedPage extends Component {
  constructor() {
    super('app');

    // 'all' or 'following'
    this.activeTab   = 'all';
    this.items       = [];
    this.offset      = 0;
    this.hasMore     = true;
    this.loading     = false;
    this._observer   = null;

    window.addEventListener('newPostCreated', (e) => this._prependPost(e.detail));
  }

  // ── Render skeleton shell ──────────────────────────────────────────────────

  render() {
    const wrap = this.createElement('div', {
      className: 'min-h-screen pb-16 md:pb-8 pt-[max(1rem,env(safe-area-inset-top))] md:pt-20'
    });

    const inner = this.createElement('div', { className: 'max-w-7xl mx-auto px-3 md:px-6' });

    // Header
    const header = this.createElement('div', { className: 'mb-4' });
    header.appendChild(this.createElement('h1', {
      className: 'text-2xl md:text-3xl font-bold leading-tight'
    }, 'Discover Art & Creators'));
    header.appendChild(this.createElement('p', {
      className: 'text-slate-400 text-xs md:text-sm mt-0.5 leading-snug'
    }, 'Browse portfolios, photos, videos and articles from the community.'));

    // Filter tabs
    const tabs = this.createElement('div', {
      id: 'feed-tabs',
      className: 'flex gap-2 mb-4'
    });
    this._buildTab(tabs, 'all',       'All Works');
    this._buildTab(tabs, 'following', 'Following');

    // Grid
    const grid = this.createElement('div', {
      id:        'feed-grid',
      className: 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4'
    });
    this._appendSkeletons(grid, 8);

    // Infinite scroll sentinel
    const sentinel = this.createElement('div', {
      id:        'feed-sentinel',
      className: 'flex justify-center py-8'
    });
    sentinel.appendChild(this.createElement('span', {
      id: 'feed-sentinel-label', className: 'text-xs text-slate-500'
    }, ''));

    inner.appendChild(header);
    inner.appendChild(tabs);
    inner.appendChild(grid);
    inner.appendChild(sentinel);
    wrap.appendChild(inner);
    return wrap;
  }

  _buildTab(container, value, label) {
    const active = value === this.activeTab;
    const btn = this.createElement('button', {
      'data-tab': value,
      className: `px-5 py-2 rounded-full text-sm font-medium transition-colors ${
        active ? 'bg-primary text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
      }`
    }, label);
    btn.addEventListener('click', () => this._switchTab(value));
    container.appendChild(btn);
  }

  _appendSkeletons(grid, n) {
    for (let i = 0; i < n; i++) {
      grid.appendChild(this.createElement('div', {
        className: 'aspect-square bg-slate-800 rounded-xl animate-pulse'
      }));
    }
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  afterRender() {
    super.afterRender();
    this._setupObserver();
    this._loadPage(true);   // replace=true clears the skeleton placeholders
  }

  // ── Data loading ───────────────────────────────────────────────────────────

  async _loadPage(replace = false) {
    if (this.loading) return;
    this.loading = true;
    this._setsentinel('Loading…');

    try {
      const params = { limit: PAGE_SIZE, offset: this.offset };
      let res;

      if (this.activeTab === 'following' && stateManager.getToken()) {
        res = await api.feed.list(params);
      } else {
        res = await api.artworks.list(params);
      }

      const raw   = res?.data?.items ?? [];
      const items = raw.map(normalize);

      if (replace) {
        this.items = items;
        this._clearGrid();
      } else {
        this.items.push(...items);
      }

      this.hasMore = items.length === PAGE_SIZE;
      this.offset  = replace ? items.length : this.offset + items.length;

      this._renderItems(items, replace);
      this._setsentinel(this.hasMore ? '' : 'You\'ve seen everything ✓');
    } catch (err) {
      this._setsentinel('Could not load posts.');
    } finally {
      this.loading = false;
    }
  }

  _clearGrid() {
    const grid = document.getElementById('feed-grid');
    if (grid) grid.innerHTML = '';
  }

  _renderItems(items, replace = false) {
    const grid = document.getElementById('feed-grid');
    if (!grid) return;

    if (replace) {
      grid.innerHTML = '';
      if (items.length === 0) {
        const empty = this.createElement('div', {
          className: 'col-span-full flex flex-col items-center justify-center py-20 text-slate-400'
        });
        const msg = this.activeTab === 'following'
          ? 'Follow some artists to see their work here'
          : 'No artworks yet — be the first to post!';
        empty.appendChild(this.createIcon('image', 'w-16 h-16 mb-4 opacity-30'));
        empty.appendChild(this.createElement('p', { className: 'text-lg font-medium' }, msg));
        if (this.activeTab === 'following') {
          const btn = this.createElement('button', {
            className: 'mt-4 px-5 py-2 bg-primary rounded-full text-sm font-medium'
          }, 'Browse all works');
          btn.addEventListener('click', () => this._switchTab('all'));
          empty.appendChild(btn);
        }
        grid.appendChild(empty);
        return;
      }
    }

    items.forEach(item => grid.appendChild(this._createCard(item)));
    if (window.lucide) window.lucide.createIcons();
  }

  // ── Tab switching ──────────────────────────────────────────────────────────

  _switchTab(value) {
    if (value === this.activeTab) return;
    if (value === 'following' && !stateManager.getToken()) {
      toast.show('Sign in to see your following feed', 'error');
      return;
    }
    this.activeTab = value;
    this.offset    = 0;
    this.hasMore   = true;

    // Update pill styles
    document.querySelectorAll('[data-tab]').forEach(btn => {
      const active = btn.dataset.tab === value;
      btn.className = `px-5 py-2 rounded-full text-sm font-medium transition-colors ${
        active ? 'bg-primary text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
      }`;
    });

    // Reset grid with skeletons then load
    const grid = document.getElementById('feed-grid');
    if (grid) { grid.innerHTML = ''; this._appendSkeletons(grid, 8); }

    this._loadPage(true);
  }

  // ── Infinite scroll ────────────────────────────────────────────────────────

  _setupObserver() {
    if (this._observer) { this._observer.disconnect(); this._observer = null; }
    const sentinel = document.getElementById('feed-sentinel');
    if (!sentinel) return;
    this._observer = new IntersectionObserver(entries => {
      if (entries[0]?.isIntersecting && this.hasMore && !this.loading) {
        this._loadPage();
      }
    }, { rootMargin: '300px' });
    this._observer.observe(sentinel);
  }

  _setsentinel(text) {
    const el = document.getElementById('feed-sentinel-label');
    if (el) el.textContent = text;
  }

  // ── New post prepend ───────────────────────────────────────────────────────

  _prependPost(post) {
    const item = normalize({
      id:              post.id,
      content_type:    post.type  || 'photo',
      title:           post.title || 'New post',
      description:     post.description || '',
      artist_name:     post.artist || '',
      artist_username: post.username || '',
      artist_avatar:   post.avatar || null,
      thumbnail:       post.image  || post.thumbnail || null,
      media_src:       post.media_src || null,
      likes_count:     0,
      comments_count:  0,
    });
    this.items.unshift(item);
    this.offset++;

    const grid = document.getElementById('feed-grid');
    if (grid) {
      const card = this._createCard(item);
      grid.insertBefore(card, grid.firstChild);
      if (window.lucide) window.lucide.createIcons();
    }
  }

  // ── Card ───────────────────────────────────────────────────────────────────

  _createCard(item) {
    const state   = stateManager.getState();
    const isLiked = !!(state.likes?.[item.id]);
    const likes   = isLiked ? item.likes + 1 : item.likes;

    const card = this.createElement('div', { className: 'group cursor-pointer' });
    const inner = this.createElement('div', {
      className: 'bg-slate-800 rounded-xl overflow-hidden hover:scale-[1.02] transition-all duration-300 h-full flex flex-col'
    });

    // Image
    const imgWrap = this.createElement('div', {
      className: 'relative aspect-square overflow-hidden bg-slate-700'
    });
    imgWrap.addEventListener('click', () => this._openContent(item));

    if (item.image) {
      const img = this.createElement('img', {
        src:       item.image,
        alt:       `${item.title} by ${item.artist}`,
        className: 'w-full h-full object-cover group-hover:scale-105 transition-transform duration-500'
      });
      img.addEventListener('error', () => {
        img.style.display = 'none';
        imgWrap.classList.add('flex', 'items-center', 'justify-center');
        imgWrap.appendChild(this.createElement('span', { className: 'text-slate-500 text-sm' }, item.title));
      });
      imgWrap.appendChild(img);
    } else {
      imgWrap.classList.add('flex', 'items-center', 'justify-center');
      imgWrap.appendChild(this.createElement('span', { className: 'text-slate-500 text-sm' }, item.type));
    }

    // Type badge for non-photo content
    if (item.type !== 'photo') {
      const badge = this._typeBadge(item.type);
      imgWrap.appendChild(badge);
    }

    // Bottom bar
    const bar = this.createElement('div', {
      className: 'p-3 flex items-center justify-between bg-slate-800'
    });

    // Artist
    const artistWrap = this.createElement('div', {
      className: 'flex items-center gap-2 min-w-0 flex-1 cursor-pointer'
    });
    artistWrap.addEventListener('click', (e) => { e.stopPropagation(); this._openProfile(item); });

    const avatarEl = this.createElement('div', {
      className: 'w-8 h-8 rounded-full flex-shrink-0 overflow-hidden bg-slate-700 flex items-center justify-center hover:ring-2 hover:ring-primary transition-all'
    });
    if (item.avatar) {
      const av = this.createElement('img', { src: item.avatar, alt: item.artist, className: 'w-full h-full object-cover' });
      av.addEventListener('error', () => {
        av.remove();
        avatarEl.textContent = (item.artist || '?').charAt(0).toUpperCase();
        avatarEl.classList.add('text-xs', 'font-bold', 'text-slate-300');
      });
      avatarEl.appendChild(av);
    } else {
      avatarEl.textContent = (item.artist || '?').charAt(0).toUpperCase();
      avatarEl.classList.add('text-xs', 'font-bold', 'text-slate-300');
    }

    const nameEl = this.createElement('span', {
      className: 'text-xs truncate hover:text-primary transition-colors'
    }, item.artist);

    artistWrap.appendChild(avatarEl);
    artistWrap.appendChild(nameEl);

    // Like button — count is always read from the DOM on click to stay accurate
    const likeBtn = this.createElement('button', {
      className: `flex items-center gap-1 transition-colors flex-shrink-0 ${isLiked ? 'text-red-500' : 'text-slate-400 hover:text-red-500'}`,
      id: `like-btn-${item.id}`
    });
    likeBtn.addEventListener('click', (e) => { e.stopPropagation(); this._handleLike(item.id, likeBtn); });

    const heartIcon = this.createIcon('heart', `w-4 h-4 ${isLiked ? 'fill-current' : ''}`);
    const likeCount = this.createElement('span', { className: 'text-xs', id: `likes-${item.id}` }, likes.toString());
    likeBtn.appendChild(heartIcon);
    likeBtn.appendChild(likeCount);

    bar.appendChild(artistWrap);
    bar.appendChild(likeBtn);
    inner.appendChild(imgWrap);
    inner.appendChild(bar);
    card.appendChild(inner);

    return card;
  }

  _typeBadge(type) {
    const map = {
      video:   { icon: 'play-circle', label: 'VIDEO',   color: 'bg-red-600' },
      podcast: { icon: 'mic',         label: 'PODCAST', color: 'bg-purple-600' },
      article: { icon: 'file-text',   label: 'ARTICLE', color: 'bg-green-600' },
    };
    const cfg = map[type] || { icon: 'image', label: type.toUpperCase(), color: 'bg-slate-600' };
    const badge = this.createElement('div', {
      className: `absolute top-2 left-2 flex items-center gap-1 px-2 py-1 ${cfg.color} rounded-full text-xs font-bold`
    });
    badge.appendChild(this.createIcon(cfg.icon, 'w-3 h-3'));
    badge.appendChild(document.createTextNode(cfg.label));
    return badge;
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  _openContent(item) {
    // All content types go through the lightbox (which now supports video/audio/article)
    stateManager.updateNested('modalState.selectedArtwork', item);
    stateManager.updateNested('modalState.artworkLightbox', true);
    window.dispatchEvent(new CustomEvent('openLightbox', { detail: item }));
  }

  _openProfile(item) {
    if (item.username) router.navigate(`/user/${item.username}`);
  }

  _handleLike(id, btn) {
    const countEl = document.getElementById(`likes-${id}`);
    // Always read the displayed count so repeated clicks stay accurate
    const currentCount = parseInt(countEl?.textContent ?? '0', 10);
    const result = stateManager.toggleLike(id, currentCount);

    if (countEl) countEl.textContent = result.newLikes.toString();
    if (btn) {
      btn.className = `flex items-center gap-1 transition-colors flex-shrink-0 ${result.isLiked ? 'text-red-500' : 'text-slate-400 hover:text-red-500'}`;
      // Flip the heart fill without re-creating the whole icon
      const svg = btn.querySelector('svg');
      if (svg) svg.classList.toggle('fill-current', result.isLiked);
    }

    if (stateManager.getToken()) {
      api.likes.toggle('artwork', id).then(res => {
        // Reconcile with the authoritative server count
        const serverCount = res?.data?.like_count;
        if (serverCount !== undefined && countEl) {
          countEl.textContent = serverCount.toString();
        }
      }).catch(() => {});
    }
  }
}
