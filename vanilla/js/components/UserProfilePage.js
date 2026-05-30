import { Component } from './Component.js';
import { router } from '../router.js';
import { stateManager } from '../utils/state.js';
import { api } from '../utils/api.js';

export class UserProfilePage extends Component {
  constructor(username) {
    super('app');
    this.username = username;
    this.user     = null;
  }

  getSeoContext() {
    return { profileName: this.user?.name || this.username };
  }

  render() {
    const container = this.createElement('div', {
      className: 'min-h-screen pb-16 md:pb-8 pt-[max(1rem,env(safe-area-inset-top))] md:pt-20'
    });

    const content = this.createElement('div', {
      className: 'max-w-5xl mx-auto px-4 md:px-6'
    });

    // Back button
    const backButton = this.createElement('button', {
      className: 'flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-3'
    });
    backButton.addEventListener('click', () => router.navigate('/feed'));
    backButton.appendChild(this.createIcon('arrow-left', 'w-5 h-5'));
    backButton.appendChild(document.createTextNode('Back to Feed'));

    // Placeholder areas filled in by afterRender
    const headerArea    = this.createElement('div', { id: 'uprofile-header' });
    const tabsArea      = this.createElement('div', { id: 'uprofile-tabs' });
    const portfolioArea = this.createElement('div', { id: 'uprofile-portfolio' });

    this._renderLoadingSkeleton(headerArea, portfolioArea);

    content.appendChild(backButton);
    content.appendChild(headerArea);
    content.appendChild(tabsArea);
    content.appendChild(portfolioArea);
    container.appendChild(content);

    return container;
  }

  _renderLoadingSkeleton(headerArea, portfolioArea) {
    // Header skeleton
    const hSkel = this.createElement('div', {
      className: 'bg-slate-800 rounded-2xl p-8 mb-6 animate-pulse h-48'
    });
    headerArea.appendChild(hSkel);

    // Tabs skeleton
    const tabsArea = document.getElementById('uprofile-tabs');
    if (tabsArea) {
      const tSkel = this.createElement('div', { className: 'flex gap-2 mb-6' });
      for (let i = 0; i < 2; i++) {
        tSkel.appendChild(this.createElement('div', { className: 'w-24 h-10 bg-slate-800 rounded-lg animate-pulse' }));
      }
      tabsArea.appendChild(tSkel);
    }

    // Portfolio skeleton
    const grid = this.createElement('div', { className: 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' });
    for (let i = 0; i < 6; i++) {
      grid.appendChild(this.createElement('div', { className: 'aspect-square bg-slate-800 rounded-xl animate-pulse' }));
    }
    portfolioArea.appendChild(grid);
  }

  afterRender() {
    super.afterRender();
    const rawUsername = this.username.replace(/^@/, '');

    api.users.showByUsername(rawUsername)
      .then(res => {
        this.user = res.data;
        this._renderHeader(this.user);
        this._renderTabs();

        // Load stats and artworks in parallel
        const statsPromise    = api.users.stats(this.user.id).catch(() => null);
        const artworksPromise = api.artworks.list({ user_id: this.user.id, limit: 50 }).catch(() => null);

        Promise.all([statsPromise, artworksPromise]).then(([statsRes, artworksRes]) => {
          if (statsRes) {
            const s = statsRes.data;
            const map = {
              'ustat-artworks':  s.total_artworks,
              'ustat-followers': s.followers_count,
              'ustat-following': s.following_count,
            };
            Object.entries(map).forEach(([id, val]) => {
              const el = document.getElementById(id);
              if (el) el.textContent = Number(val).toLocaleString();
            });
          }
          this._renderPortfolio(artworksRes?.data?.items || []);
        });
      })
      .catch(() => {
        const headerArea = document.getElementById('uprofile-header');
        if (headerArea) {
          headerArea.innerHTML = '';
          const err = this.createElement('div', {
            className: 'text-center py-20 text-slate-400'
          }, 'User not found.');
          headerArea.appendChild(err);
        }
        const portfolioArea = document.getElementById('uprofile-portfolio');
        if (portfolioArea) portfolioArea.innerHTML = '';
      });
  }

  _renderHeader(user) {
    const headerArea = document.getElementById('uprofile-header');
    if (!headerArea) return;
    headerArea.innerHTML = '';

    const displayName = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username;
    const avatar      = user.profile_picture_url || null;

    const header = this.createElement('div', {
      className: 'bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 mb-6 border border-slate-700'
    });

    const flex = this.createElement('div', {
      className: 'flex flex-col md:flex-row gap-8 items-center md:items-start'
    });

    // Avatar
    const avatarRing = this.createElement('div', {
      className: 'w-36 h-36 rounded-full bg-gradient-to-br from-primary to-purple-600 p-1 flex-shrink-0'
    });
    const avatarInner = this.createElement('div', {
      className: 'w-full h-full rounded-full overflow-hidden bg-slate-700 border-4 border-slate-900 flex items-center justify-center'
    });
    if (avatar) {
      const img = this.createElement('img', {
        src: avatar,
        alt: `Profile photo of ${displayName}`,
        className: 'w-full h-full object-cover'
      });
      avatarInner.appendChild(img);
    } else {
      const initials = displayName.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
      avatarInner.appendChild(this.createElement('span', {
        className: 'text-4xl font-bold text-slate-300 select-none'
      }, initials || '?'));
    }
    avatarRing.appendChild(avatarInner);

    // Info
    const info = this.createElement('div', { className: 'flex-1 text-center md:text-left' });

    const nameRow = this.createElement('div', {
      className: 'flex items-center justify-center md:justify-start gap-2 mb-2'
    });
    nameRow.appendChild(this.createElement('h1', { className: 'text-4xl font-bold' }, displayName));
    nameRow.appendChild(this.createIcon('badge-check', 'w-8 h-8 text-primary'));

    const usernameEl = this.createElement('p', { className: 'text-slate-400 text-lg mb-4' }, `@${user.username}`);

    const bioEl = this.createElement('p', {
      className: `text-slate-300 mb-6 max-w-2xl ${user.bio ? '' : 'italic text-slate-500'}`
    }, user.bio || 'No bio yet.');

    // Stats
    const statsGrid = this.createElement('div', { className: 'grid grid-cols-3 gap-4 mb-6' });
    [
      { label: 'Artworks',  icon: 'image',     id: 'ustat-artworks',  value: 0 },
      { label: 'Followers', icon: 'users',     id: 'ustat-followers', value: 0 },
      { label: 'Following', icon: 'user-plus', id: 'ustat-following', value: 0 },
    ].forEach(stat => {
      const card = this.createElement('div', {
        className: 'bg-slate-800/50 rounded-xl p-4 text-center border border-slate-700 hover:border-primary transition-colors'
      });
      card.appendChild(this.createIcon(stat.icon, 'w-5 h-5 mx-auto mb-2 text-primary'));
      card.appendChild(this.createElement('div', { className: 'text-2xl font-bold mb-1', id: stat.id }, '…'));
      card.appendChild(this.createElement('div', { className: 'text-sm text-slate-400' }, stat.label));
      statsGrid.appendChild(card);
    });

    // Buttons
    const buttons = this.createElement('div', { className: 'flex gap-3 justify-center md:justify-start flex-wrap' });

    const state       = stateManager.getState();
    const currentUser = state.user ?? state.currentUser;
    const isOwnProfile = currentUser && (currentUser.id === user.id || currentUser.username === user.username);

    if (!isOwnProfile) {
      const followBtn = this.createElement('button', {
        id:        'uprofile-follow-btn',
        className: 'flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover rounded-xl transition-all hover:scale-105 font-medium'
      });

      // Check if already following
      let isFollowing = false;
      if (currentUser) {
        api.users.stats(currentUser.id).then(res => {
          // We can't easily check follow status without a dedicated endpoint,
          // so we just start with Follow state — the toggle response tells us the new state
        }).catch(() => {});
      }

      const setFollowState = (following) => {
        isFollowing = following;
        followBtn.innerHTML = '';
        followBtn.appendChild(this.createIcon(following ? 'user-check' : 'user-plus', 'w-4 h-4'));
        followBtn.appendChild(document.createTextNode(following ? 'Following' : 'Follow'));
        followBtn.className = `flex items-center gap-2 px-6 py-3 rounded-xl transition-all hover:scale-105 font-medium ${
          following
            ? 'bg-slate-700 hover:bg-slate-600'
            : 'bg-primary hover:bg-primary-hover'
        }`;
        if (window.lucide) window.lucide.createIcons();
      };

      setFollowState(false);

      followBtn.addEventListener('click', () => {
        if (!stateManager.getToken()) { router.navigate('/auth'); return; }
        api.users.follow(user.id)
          .then(res => setFollowState(res.data?.following ?? !isFollowing))
          .catch(() => {});
      });

      buttons.appendChild(followBtn);
    }

    const msgBtn = this.createElement('button', {
      className: 'flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl transition-all hover:scale-105 font-medium'
    });
    msgBtn.appendChild(this.createIcon('message-circle', 'w-4 h-4'));
    msgBtn.appendChild(document.createTextNode('Message'));
    msgBtn.addEventListener('click', () => router.navigate('/messages'));

    buttons.appendChild(msgBtn);

    info.appendChild(nameRow);
    info.appendChild(usernameEl);
    info.appendChild(bioEl);
    info.appendChild(statsGrid);
    info.appendChild(buttons);

    flex.appendChild(avatarRing);
    flex.appendChild(info);
    header.appendChild(flex);
    headerArea.appendChild(header);

    if (window.lucide) window.lucide.createIcons();
  }

  _renderTabs() {
    const tabsArea = document.getElementById('uprofile-tabs');
    if (!tabsArea) return;
    tabsArea.innerHTML = '';

    const bar = this.createElement('div', {
      className: 'flex gap-2 border-b border-slate-800 mb-6 overflow-x-auto hide-scrollbar'
    });

    [{ name: 'Portfolio', icon: 'grid-3x3' }, { name: 'Collections', icon: 'bookmark' }]
      .forEach((tab, i) => {
        const btn = this.createElement('button', {
          className: `flex items-center gap-2 px-6 py-3 font-medium transition-all whitespace-nowrap ${
            i === 0
              ? 'text-primary border-b-2 border-primary'
              : 'text-slate-400 hover:text-white border-b-2 border-transparent hover:border-slate-600'
          }`
        });
        btn.appendChild(this.createIcon(tab.icon, 'w-4 h-4'));
        btn.appendChild(document.createTextNode(tab.name));
        bar.appendChild(btn);
      });

    tabsArea.appendChild(bar);
    if (window.lucide) window.lucide.createIcons();
  }

  _renderPortfolio(artworks) {
    const area = document.getElementById('uprofile-portfolio');
    if (!area) return;
    area.innerHTML = '';

    if (!artworks || artworks.length === 0) {
      const empty = this.createElement('div', {
        className: 'flex flex-col items-center justify-center py-20 text-slate-400'
      });
      empty.appendChild(this.createIcon('image', 'w-16 h-16 mb-4 opacity-30'));
      empty.appendChild(this.createElement('p', { className: 'text-lg font-medium mb-1' }, 'No artworks yet'));
      empty.appendChild(this.createElement('p', { className: 'text-sm' }, 'This artist hasn\'t posted anything yet.'));
      area.appendChild(empty);
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    const displayName = this.user
      ? ([this.user.first_name, this.user.last_name].filter(Boolean).join(' ') || this.user.username)
      : this.username;
    const avatar = this.user?.profile_picture_url || null;

    const grid = this.createElement('div', {
      className: 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
    });

    artworks.forEach(artwork => {
      const card = this.createElement('div', {
        className: 'aspect-square bg-slate-800 rounded-xl overflow-hidden cursor-pointer hover:scale-105 transition-all relative group'
      });

      card.addEventListener('click', () => {
        const detail = {
          id:          artwork.id,
          image:       artwork.thumbnail,
          title:       artwork.title,
          description: artwork.description || '',
          artist:      displayName,
          username:    this.user?.username || this.username,
          avatar,
          created_at:  artwork.created_at,
          likes:       artwork.likes_count    || 0,
          comments:    artwork.comments_count || 0,
          isLiked:     false
        };
        stateManager.updateNested('modalState.selectedArtwork', detail);
        stateManager.updateNested('modalState.artworkLightbox', true);
        window.dispatchEvent(new CustomEvent('openLightbox', { detail }));
      });

      const image = this.createElement('img', {
        src:       artwork.thumbnail,
        alt:       `${artwork.title} by ${displayName}`,
        className: 'w-full h-full object-cover'
      });

      const overlay = this.createElement('div', {
        className: 'absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4'
      });
      const stats = this.createElement('div', { className: 'flex items-center justify-between' });

      const likesDiv = this.createElement('div', { className: 'flex items-center gap-1 text-white' });
      likesDiv.appendChild(this.createIcon('heart', 'w-5 h-5'));
      likesDiv.appendChild(this.createElement('span', { className: 'font-medium' }, String(artwork.likes_count || 0)));

      const cmtDiv = this.createElement('div', { className: 'flex items-center gap-1 text-white' });
      cmtDiv.appendChild(this.createIcon('message-circle', 'w-5 h-5'));
      cmtDiv.appendChild(this.createElement('span', { className: 'font-medium' }, String(artwork.comments_count || 0)));

      stats.appendChild(likesDiv);
      stats.appendChild(cmtDiv);
      overlay.appendChild(stats);

      card.appendChild(image);
      card.appendChild(overlay);
      grid.appendChild(card);
    });

    area.appendChild(grid);
    if (window.lucide) window.lucide.createIcons();
  }
}
