import { Component } from './Component.js';
import { stateManager } from '../utils/state.js';
import { router } from '../router.js';
import { EditProfileModal } from './EditProfileModal.js';
import { api } from '../utils/api.js';

export class ProfilePage extends Component {
  render() {
    const state = stateManager.getState();
    const user = state.currentUser;

    const container = this.createElement('div', {
      className:
        'min-h-screen pb-16 md:pb-8 pt-[max(1rem,env(safe-area-inset-top))] md:pt-20'
    });

    const contentContainer = this.createElement('div', {
      className: 'max-w-5xl mx-auto px-4 md:px-6'
    });

    // Profile Header
    const header = this.createProfileHeader(user);
    
    // Tabs
    const tabs = this.createTabs();
    
    // Portfolio Grid
    const portfolio = this.createPortfolio();

    contentContainer.appendChild(header);
    contentContainer.appendChild(tabs);
    contentContainer.appendChild(portfolio);
    container.appendChild(contentContainer);

    return container;
  }

  createProfileHeader(user) {
    const header = this.createElement('div', {
      className: 'bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 mb-6 border border-slate-700'
    });

    const flexContainer = this.createElement('div', {
      className: 'flex flex-col md:flex-row gap-8 items-center md:items-start'
    });

    // Avatar with ring
    const avatarContainer = this.createElement('div', {
      className: 'relative flex-shrink-0'
    });

    const avatarRing = this.createElement('div', {
      className: 'w-36 h-36 rounded-full bg-gradient-to-br from-primary to-purple-600 p-1'
    });

    const avatarInner = this.createElement('div', {
      className: 'w-full h-full rounded-full overflow-hidden bg-slate-700 border-4 border-slate-900 flex items-center justify-center'
    });

    if (user.avatar) {
      const avatar = this.createElement('img', {
        src: user.avatar,
        alt: `Profile photo of ${user.name}`,
        className: 'w-full h-full object-cover'
      });
      avatarInner.appendChild(avatar);
    } else {
      const initials = (user.name || user.username || '?')
        .split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
      const initialsEl = this.createElement('span', {
        className: 'text-4xl font-bold text-slate-300 select-none'
      }, initials);
      avatarInner.appendChild(initialsEl);
    }

    avatarRing.appendChild(avatarInner);
    avatarContainer.appendChild(avatarRing);

    // Info
    const infoContainer = this.createElement('div', {
      className: 'flex-1 text-center md:text-left'
    });

    const nameRow = this.createElement('div', {
      className: 'flex items-center justify-center md:justify-start gap-2 mb-2'
    });

    const name = this.createElement('h1', {
      className: 'text-4xl font-bold'
    }, user.name);

    const verifiedBadge = this.createIcon('badge-check', 'w-8 h-8 text-primary');

    nameRow.appendChild(name);
    nameRow.appendChild(verifiedBadge);

    const username = this.createElement('p', {
      className: 'text-slate-400 text-lg mb-4'
    }, user.username);

    const bio = this.createElement('p', {
      className: `text-slate-300 mb-6 max-w-2xl ${user.bio ? '' : 'italic text-slate-500'}`
    }, user.bio || 'No bio yet — click Edit Profile to add one');

    // Stats in cards
    const statsContainer = this.createElement('div', {
      className: 'grid grid-cols-3 gap-4 mb-6'
    });

    const statsData = [
      { label: 'Artworks',  value: user.artworks  || 0, icon: 'image',    id: 'stat-artworks' },
      { label: 'Followers', value: user.followers || 0, icon: 'users',    id: 'stat-followers' },
      { label: 'Following', value: user.following  || 0, icon: 'user-plus', id: 'stat-following' },
    ];

    statsData.forEach(stat => {
      const statCard = this.createElement('div', {
        className: 'bg-slate-800/50 rounded-xl p-4 text-center border border-slate-700 hover:border-primary transition-colors cursor-pointer'
      });

      const icon  = this.createIcon(stat.icon, 'w-5 h-5 mx-auto mb-2 text-primary');
      const value = this.createElement('div', {
        className: 'text-2xl font-bold mb-1',
        id: stat.id,
      }, stat.value.toString());
      const label = this.createElement('div', { className: 'text-sm text-slate-400' }, stat.label);

      statCard.appendChild(icon);
      statCard.appendChild(value);
      statCard.appendChild(label);
      statsContainer.appendChild(statCard);
    });

    // Buttons
    const buttons = this.createElement('div', {
      className: 'flex gap-3 justify-center md:justify-start flex-wrap'
    });

    const editButton = this.createElement('button', {
      className: 'flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover rounded-xl transition-all hover:scale-105 font-medium'
    });
    editButton.addEventListener('click', () => this.openEditModal());
    const editIcon = this.createIcon('edit-3', 'w-4 h-4');
    const editText = document.createTextNode('Edit Profile');
    editButton.appendChild(editIcon);
    editButton.appendChild(editText);

    const settingsButton = this.createElement('button', {
      className: 'flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl transition-all hover:scale-105 font-medium'
    });
    settingsButton.addEventListener('click', () => router.navigate('/settings'));
    const settingsIcon = this.createIcon('settings', 'w-4 h-4');
    const settingsText = document.createTextNode('Settings');
    settingsButton.appendChild(settingsIcon);
    settingsButton.appendChild(settingsText);

    const shareButton = this.createElement('button', {
      className: 'flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl transition-all hover:scale-105 font-medium'
    });
    const shareIcon = this.createIcon('share-2', 'w-4 h-4');
    const shareText = document.createTextNode('Share');
    shareButton.appendChild(shareIcon);
    shareButton.appendChild(shareText);

    buttons.appendChild(editButton);
    buttons.appendChild(settingsButton);
    buttons.appendChild(shareButton);

    infoContainer.appendChild(nameRow);
    infoContainer.appendChild(username);
    infoContainer.appendChild(bio);
    infoContainer.appendChild(statsContainer);
    infoContainer.appendChild(buttons);

    flexContainer.appendChild(avatarContainer);
    flexContainer.appendChild(infoContainer);
    header.appendChild(flexContainer);

    return header;
  }

  createTabs() {
    const tabsContainer = this.createElement('div', {
      className: 'flex gap-2 border-b border-slate-800 mb-6 overflow-x-auto hide-scrollbar'
    });

    const tabs = [
      { name: 'Portfolio', icon: 'grid-3x3' },
      { name: 'Collections', icon: 'bookmark' },
      { name: 'Liked', icon: 'heart' }
    ];
    
    tabs.forEach((tab, index) => {
      const button = this.createElement('button', {
        className: `flex items-center gap-2 px-6 py-3 font-medium transition-all whitespace-nowrap ${
          index === 0
            ? 'text-primary border-b-2 border-primary'
            : 'text-slate-400 hover:text-white border-b-2 border-transparent hover:border-slate-600'
        }`
      });

      const icon = this.createIcon(tab.icon, 'w-4 h-4');
      const text = document.createTextNode(tab.name);
      button.appendChild(icon);
      button.appendChild(text);
      
      tabsContainer.appendChild(button);
    });

    return tabsContainer;
  }

  createPortfolio() {
    const wrapper = this.createElement('div', { id: 'portfolio-wrapper' });

    // Loading skeleton
    const loading = this.createElement('div', {
      className: 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4',
      id: 'portfolio-loading'
    });
    for (let i = 0; i < 4; i++) {
      const skel = this.createElement('div', {
        className: 'aspect-square bg-slate-800 rounded-xl animate-pulse'
      });
      loading.appendChild(skel);
    }

    wrapper.appendChild(loading);
    return wrapper;
  }

  renderArtworkGrid(artworks) {
    const wrapper = document.getElementById('portfolio-wrapper');
    if (!wrapper) return;
    wrapper.innerHTML = '';

    if (!artworks || artworks.length === 0) {
      const empty = this.createElement('div', {
        className: 'col-span-full flex flex-col items-center justify-center py-20 text-slate-400'
      });
      const icon = this.createIcon('image', 'w-16 h-16 mb-4 opacity-30');
      const msg  = this.createElement('p', { className: 'text-lg font-medium mb-1' }, 'No artworks yet');
      const sub  = this.createElement('p', { className: 'text-sm' }, 'Upload your first artwork to get started');
      empty.appendChild(icon);
      empty.appendChild(msg);
      empty.appendChild(sub);
      wrapper.appendChild(empty);
      return;
    }

    const grid = this.createElement('div', {
      className: 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
    });

    const user = stateManager.getState().currentUser;

    artworks.forEach((artwork) => {
      const card = this.createElement('div', {
        className: 'aspect-square bg-slate-800 rounded-xl overflow-hidden cursor-pointer hover:scale-105 transition-all relative group'
      });

      card.addEventListener('click', () => this.openArtworkLightbox({
        id:          artwork.id,
        image:       artwork.thumbnail,
        title:       artwork.title,
        description: artwork.description || '',
        artist:      user.name,
        username:    user._raw?.username || user.username?.replace(/^@/, ''),
        avatar:      user.avatar || null,
        created_at:  artwork.created_at,
        likes:       artwork.likes_count   || 0,
        comments:    artwork.comments_count || 0,
        isLiked:     false
      }));

      const image = this.createElement('img', {
        src:       artwork.thumbnail,
        alt:       `${artwork.title} — portfolio artwork by ${user.name} on Artistry`,
        className: 'w-full h-full object-cover'
      });

      const overlay = this.createElement('div', {
        className: 'absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4'
      });

      const stats = this.createElement('div', { className: 'flex items-center justify-between' });

      const likesDiv = this.createElement('div', { className: 'flex items-center gap-1 text-white' });
      likesDiv.appendChild(this.createIcon('heart', 'w-5 h-5'));
      likesDiv.appendChild(this.createElement('span', { className: 'font-medium' }, String(artwork.likes_count || 0)));

      const commentsDiv = this.createElement('div', { className: 'flex items-center gap-1 text-white' });
      commentsDiv.appendChild(this.createIcon('message-circle', 'w-5 h-5'));
      commentsDiv.appendChild(this.createElement('span', { className: 'font-medium' }, String(artwork.comments_count || 0)));

      stats.appendChild(likesDiv);
      stats.appendChild(commentsDiv);
      overlay.appendChild(stats);

      card.appendChild(image);
      card.appendChild(overlay);
      grid.appendChild(card);
    });

    wrapper.appendChild(grid);
  }

  afterRender() {
    super.afterRender();
    const userId = stateManager.getState().currentUser?._raw?.id;
    if (!userId) return;

    // Load stats
    api.users.stats(userId).then(res => {
      const s = res.data;
      const map = {
        'stat-artworks':  s.total_artworks,
        'stat-followers': s.followers_count,
        'stat-following': s.following_count,
      };
      Object.entries(map).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = Number(val).toLocaleString();
      });
    }).catch(() => { /* stats are non-critical */ });

    // Load real artworks for this user
    api.artworks.list({ user_id: userId, limit: 50 }).then(res => {
      this.renderArtworkGrid(res.data?.items || []);
    }).catch(() => {
      this.renderArtworkGrid([]);
    });
  }

  openArtworkLightbox(artwork) {
    stateManager.updateNested('modalState.selectedArtwork', artwork);
    stateManager.updateNested('modalState.artworkLightbox', true);
    
    // Trigger lightbox render
    const event = new CustomEvent('openLightbox', { detail: artwork });
    window.dispatchEvent(event);
  }

  openEditModal() {
    const modal = new EditProfileModal();
    modal.mount();
  }
}

