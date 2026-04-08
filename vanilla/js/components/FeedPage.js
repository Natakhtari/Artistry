import { Component } from './Component.js';
import { stateManager } from '../utils/state.js';
import { avatars } from '../utils/avatars.js';
import { router } from '../router.js';

// JPEG photos only (no transparent PNGs). Verified Pixabay JPGs + Picsum seeds for variety.
const PIXABAY_JPG = [
  'https://cdn.pixabay.com/photo/2018/03/10/12/00/teamwork-3213924_960_720.jpg',
  'https://cdn.pixabay.com/photo/2017/08/30/01/05/milky-way-2695569_960_720.jpg',
  'https://cdn.pixabay.com/photo/2016/11/18/17/46/house-1836070_960_720.jpg',
  'https://cdn.pixabay.com/photo/2016/11/29/03/53/architecture-1867187_960_720.jpg',
  'https://cdn.pixabay.com/photo/2016/11/29/09/32/concept-1868728_960_720.jpg',
  'https://cdn.pixabay.com/photo/2015/01/08/18/29/entrepreneur-593358_960_720.jpg',
  'https://cdn.pixabay.com/photo/2016/11/29/12/13/fence-1869401_960_720.jpg',
  'https://cdn.pixabay.com/photo/2017/02/08/17/46/sunset-2048727_960_720.jpg',
  'https://cdn.pixabay.com/photo/2016/11/29/02/05/audience-1866738_960_720.jpg',
  'https://cdn.pixabay.com/photo/2016/11/23/15/32/piano-1853301_960_720.jpg',
  'https://cdn.pixabay.com/photo/2016/11/29/09/16/architecture-1868667_960_720.jpg',
  'https://cdn.pixabay.com/photo/2017/08/07/16/36/people-2608145_960_720.jpg',
  'https://cdn.pixabay.com/photo/2016/11/29/04/19/beach-1867285_960_720.jpg',
  'https://cdn.pixabay.com/photo/2016/11/29/13/23/animal-1868911_960_720.jpg',
  'https://cdn.pixabay.com/photo/2016/11/29/10/41/architecture-1868668_960_720.jpg',
  'https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_960_720.jpg',
  'https://cdn.pixabay.com/photo/2016/05/05/02/37/sunset-1373171_960_720.jpg',
  'https://cdn.pixabay.com/photo/2014/12/15/17/19/painting-576798_960_720.jpg'
];

const PICSUM_SEEDS = [
  'artistry-a', 'artistry-b', 'artistry-c', 'artistry-d', 'artistry-e', 'artistry-f',
  'artistry-g', 'artistry-h', 'artistry-i', 'artistry-j', 'artistry-k', 'artistry-l',
  'artistry-m', 'artistry-n', 'artistry-o', 'artistry-p', 'artistry-q', 'artistry-r',
  'artistry-s', 'artistry-t', 'artistry-u', 'artistry-v', 'artistry-w', 'artistry-x',
  'artistry-y', 'artistry-z', 'artistry-aa', 'artistry-ab', 'artistry-ac', 'artistry-ad',
  'artistry-ae', 'artistry-af', 'artistry-ag', 'artistry-ah', 'artistry-ai', 'artistry-aj',
  'artistry-ak', 'artistry-al', 'artistry-am', 'artistry-an', 'artistry-ao', 'artistry-ap'
].map((seed) => `https://picsum.photos/seed/${seed}/960/960`);

const FEED_IMAGE_POOL = [...PIXABAY_JPG, ...PICSUM_SEEDS];

const CREATORS = [
  { artist: 'Elena Rodriguez', avatar: avatars.elenaRodriguez },
  { artist: 'Marcus Chen', avatar: avatars.marcusChen },
  { artist: 'Sophia Laurent', avatar: avatars.sophiaLaurent },
  { artist: 'Alex Kim', avatar: avatars.alexKim },
  { artist: 'Yuki Tanaka', avatar: avatars.yukiTanaka },
  { artist: 'Nina Patel', avatar: avatars.ninaPatel },
  { artist: 'Carlos Santos', avatar: avatars.carlosSantos },
  { artist: 'Aria Johnson', avatar: avatars.ariajohnson },
  { artist: 'James Taylor', avatar: avatars.jamesTaylor }
];

const TITLE_A = [
  'Abstract',
  'Urban',
  'Digital',
  'Morning',
  'Silent',
  'Neon',
  'Coastal',
  'Winter',
  'Studio',
  'Raw',
  'Soft',
  'Bold'
];
const TITLE_B = [
  'Dreams',
  'Layers',
  'Study',
  'Light',
  'Motion',
  'Echoes',
  'Fragments',
  'Rhythm',
  'Horizon',
  'Sketch',
  'Canvas',
  'Noise'
];
const DESCRIPTIONS = [
  'Exploring color, texture, and form in a single frame.',
  'A quiet moment captured between brushstrokes.',
  'Experimenting with light and negative space.',
  'Inspired by travel, memory, and sound.',
  'Part of an ongoing series on movement and stillness.',
  'Blending digital tools with traditional technique.',
  'Sketchbook ideas brought to a finished piece.',
  'Celebrating imperfection and happy accidents.',
  'Built from layers of glaze and patience.',
  'A tribute to the artists who came before.'
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDuration() {
  const m = Math.floor(Math.random() * 45) + 3;
  const s = Math.floor(Math.random() * 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function randomViews() {
  const n = Math.random() * 50 + 1;
  return n >= 10 ? `${n.toFixed(1)}K` : `${Math.round(n * 1000)}`;
}

export class FeedPage extends Component {
  constructor() {
    super('app');
    this.batchSize = 12;
    this.nextId = 1;
    this.feed = [];
    this._loadingMore = false;
    this._loadObserver = null;
    this.appendRandomBatch(this.batchSize * 3);

    window.addEventListener('newPostCreated', (e) => {
      this.addNewPost(e.detail);
    });
  }

  appendRandomBatch(count) {
    for (let i = 0; i < count; i++) {
      this.feed.push(this.createRandomPost(this.nextId++));
    }
  }

  createRandomPost(id) {
    const types = ['artwork', 'video', 'podcast', 'article'];
    const type = pick(types);
    const creator = pick(CREATORS);
    const imageUrl = pick(FEED_IMAGE_POOL);
    const title = `${pick(TITLE_A)} ${pick(TITLE_B)}`;
    const description = pick(DESCRIPTIONS);
    const likes = 40 + Math.floor(Math.random() * 960);

    const base = {
      id,
      type,
      artist: creator.artist,
      avatar: creator.avatar,
      likes,
      title,
      description
    };

    switch (type) {
      case 'artwork':
        return { ...base, image: imageUrl };
      case 'video':
        return {
          ...base,
          thumbnail: imageUrl,
          views: randomViews(),
          duration: randomDuration()
        };
      case 'podcast':
        return {
          ...base,
          cover: imageUrl,
          duration: `${15 + Math.floor(Math.random() * 45)} min`
        };
      case 'article':
        return {
          ...base,
          thumbnail: imageUrl,
          readTime: `${3 + Math.floor(Math.random() * 12)} min read`
        };
      default:
        return { ...base, image: imageUrl };
    }
  }

  addNewPost(post) {
    console.log('FeedPage: Adding new post to feed:', post);
    const id = post.id != null ? Number(post.id) : this.nextId++;
    const normalized = { ...post, id };
    this.feed.unshift(normalized);
    if (id >= this.nextId) this.nextId = id + 1;
    this.rerender();
  }

  rerender() {
    const appContainer = document.getElementById('app');
    if (appContainer) {
      appContainer.innerHTML = '';
      this.mount();
    }
  }

  loadMoreFeed() {
    if (this._loadingMore) return;
    this._loadingMore = true;
    const sentinel = document.getElementById('feed-load-sentinel');
    if (this._loadObserver && sentinel) {
      this._loadObserver.unobserve(sentinel);
    }

    const batch = [];
    for (let i = 0; i < this.batchSize; i++) {
      batch.push(this.createRandomPost(this.nextId++));
    }
    this.feed.push(...batch);
    const grid = document.getElementById('feed-grid');
    if (grid) {
      batch.forEach((item) => grid.appendChild(this.createFeedCard(item)));
      if (window.lucide) {
        window.lucide.createIcons();
      }
    }

    setTimeout(() => {
      this._loadingMore = false;
      if (this._loadObserver && sentinel && sentinel.parentNode) {
        this._loadObserver.observe(sentinel);
      }
    }, 450);
  }

  render() {
    const container = this.createElement('div', {
      className:
        'min-h-screen pb-16 md:pb-8 pt-[max(1rem,env(safe-area-inset-top))] md:pt-20'
    });

    const contentContainer = this.createElement('div', {
      className: 'max-w-7xl mx-auto px-3 md:px-6'
    });

    const header = this.createElement('div', {
      className: 'mb-2 md:mb-4'
    });

    const title = this.createElement('h1', {
      className: 'text-2xl md:text-3xl font-bold leading-tight'
    }, 'Explore Top Visual Artists & Portfolios');

    const subtitle = this.createElement('p', {
      className: 'text-slate-400 text-xs md:text-sm mt-0.5 md:mt-1 leading-snug max-md:line-clamp-2'
    }, 'Discover digital art, 3D, and illustration portfolios — scroll for more.');

    header.appendChild(title);
    header.appendChild(subtitle);

    const grid = this.createElement('div', {
      className: 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4',
      id: 'feed-grid'
    });

    this.feed.forEach((item) => {
      grid.appendChild(this.createFeedCard(item));
    });

    const sentinel = this.createElement('div', {
      id: 'feed-load-sentinel',
      className: 'flex justify-center py-8 min-h-[4rem]',
      'aria-hidden': 'true'
    });
    const hint = this.createElement('span', {
      className: 'text-xs text-slate-500'
    }, 'Loading more…');
    sentinel.appendChild(hint);

    contentContainer.appendChild(header);
    contentContainer.appendChild(grid);
    contentContainer.appendChild(sentinel);
    container.appendChild(contentContainer);

    return container;
  }

  afterRender() {
    if (this._loadObserver) {
      this._loadObserver.disconnect();
      this._loadObserver = null;
    }
    const sentinel = document.getElementById('feed-load-sentinel');
    if (!sentinel) {
      super.afterRender();
      return;
    }

    this._loadObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          this.loadMoreFeed();
        }
      },
      { root: null, rootMargin: '280px', threshold: 0 }
    );
    this._loadObserver.observe(sentinel);
    super.afterRender();
  }

  createFeedCard(item) {
    const state = stateManager.getState();
    const isLiked = state.likes[item.id] || false;
    const likes = isLiked ? item.likes + 1 : item.likes;

    const card = this.createElement('div', {
      className: 'group cursor-pointer'
    });

    const cardInner = this.createElement('div', {
      className: 'bg-slate-800 rounded-xl overflow-hidden hover:transform hover:scale-[1.02] transition-all duration-300 h-full flex flex-col'
    });

    const imageContainer = this.createElement('div', {
      className: 'relative aspect-square overflow-hidden bg-slate-700'
    });
    imageContainer.addEventListener('click', () => this.openContent(item));

    const imageUrl = item.image || item.thumbnail || item.cover;
    const typeLabel = item.type === 'artwork' ? 'artwork' : item.type;
    const image = this.createElement('img', {
      src: imageUrl,
      alt: `${item.title} — ${typeLabel} by ${item.artist} on Artistry`,
      className: 'w-full h-full object-cover'
    });

    image.addEventListener('error', (e) => {
      console.warn('Image failed to load:', imageUrl);
      e.target.src =
        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="500" height="500"%3E%3Crect fill="%231e293b" width="500" height="500"/%3E%3Ctext fill="%2364748b" font-family="sans-serif" font-size="24" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3E' +
        encodeURIComponent(item.type || 'Image') +
        '%3C/text%3E%3C/svg%3E';
    });

    imageContainer.appendChild(image);

    if (item.type !== 'artwork') {
      const badge = this.createTypeBadge(item);
      imageContainer.appendChild(badge);
    }

    if (item.duration || item.readTime || item.views) {
      const overlay = this.createElement(
        'div',
        {
          className: 'absolute bottom-2 right-2 px-2 py-1 bg-black/80 rounded text-xs font-medium'
        },
        item.duration || item.readTime || ''
      );
      imageContainer.appendChild(overlay);
    }

    const infoContainer = this.createElement('div', {
      className: 'p-3 flex items-center justify-between bg-slate-800'
    });

    const artistInfo = this.createElement('div', {
      className: 'flex items-center gap-2 min-w-0 flex-1'
    });

    const avatarContainer = this.createElement('div', {
      className: 'w-8 h-8 rounded-full overflow-hidden bg-slate-700 flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-primary transition-all'
    });

    avatarContainer.addEventListener('click', (e) => {
      e.stopPropagation();
      console.log('Avatar clicked for artist:', item.artist);
      this.openUserProfile(item.artist);
    });

    const avatar = this.createElement('img', {
      src: item.avatar,
      alt: `Profile photo of ${item.artist}, artist on Artistry`,
      className: 'w-full h-full object-cover'
    });

    const artistName = this.createElement('span', {
      className: 'text-xs truncate cursor-pointer hover:text-primary transition-colors'
    }, item.artist);

    artistName.addEventListener('click', (e) => {
      e.stopPropagation();
      console.log('Artist name clicked:', item.artist);
      this.openUserProfile(item.artist);
    });

    avatarContainer.appendChild(avatar);
    artistInfo.appendChild(avatarContainer);
    artistInfo.appendChild(artistName);

    const likeButton = this.createElement('button', {
      className: `flex items-center gap-1 text-slate-400 hover:text-red-500 transition-colors group/like flex-shrink-0 ${isLiked ? 'text-red-500' : ''}`,
      id: `like-btn-${item.id}`
    });
    likeButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleLike(item.id, likes, likeButton);
    });

    const heartIcon = this.createIcon('heart', `w-4 h-4 group-hover/like:fill-current ${isLiked ? 'fill-current' : ''}`);
    const likeCount = this.createElement('span', {
      className: 'text-xs',
      id: `likes-${item.id}`
    }, likes.toString());

    likeButton.appendChild(heartIcon);
    likeButton.appendChild(likeCount);

    infoContainer.appendChild(artistInfo);
    infoContainer.appendChild(likeButton);

    cardInner.appendChild(imageContainer);
    cardInner.appendChild(infoContainer);
    card.appendChild(cardInner);

    return card;
  }

  createTypeBadge(item) {
    let icon;
    let label;
    let color;

    switch (item.type) {
      case 'video':
        icon = 'play-circle';
        label = 'VIDEO';
        color = 'bg-red-600';
        break;
      case 'podcast':
        icon = 'mic';
        label = 'PODCAST';
        color = 'bg-purple-600';
        break;
      case 'article':
        icon = 'file-text';
        label = 'ARTICLE';
        color = 'bg-green-600';
        break;
      default:
        return this.createElement('div');
    }

    const badge = this.createElement('div', {
      className: `absolute top-2 left-2 flex items-center gap-1 px-2 py-1 ${color} rounded-full text-xs font-bold`
    });

    const badgeIcon = this.createIcon(icon, 'w-3 h-3');
    const badgeText = document.createTextNode(label);

    badge.appendChild(badgeIcon);
    badge.appendChild(badgeText);

    return badge;
  }

  openContent(item) {
    console.log('FeedPage: openContent called for:', item.title, 'type:', item.type);
    if (item.type === 'artwork') {
      console.log('FeedPage: Opening lightbox for artwork');
      this.openLightbox(item);
    } else {
      console.log('FeedPage: Opening content viewer for', item.type);
      const event = new CustomEvent('openContentViewer', {
        detail: { type: item.type, data: item }
      });
      window.dispatchEvent(event);
    }
  }

  handleLike(itemId, currentLikes, buttonElement) {
    console.log('FeedPage: handleLike called for item', itemId);
    const result = stateManager.toggleLike(itemId, currentLikes);
    console.log('FeedPage: Like result:', result);

    const likeElement = document.getElementById(`likes-${itemId}`);
    if (likeElement) {
      likeElement.textContent = result.newLikes.toString();
    }

    if (buttonElement) {
      if (result.isLiked) {
        buttonElement.classList.add('text-red-500');
        buttonElement.classList.remove('text-slate-400');
      } else {
        buttonElement.classList.remove('text-red-500');
        buttonElement.classList.add('text-slate-400');
      }
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  openLightbox(artwork) {
    console.log('FeedPage: openLightbox called for:', artwork.title);
    stateManager.updateNested('modalState.selectedArtwork', artwork);
    stateManager.updateNested('modalState.artworkLightbox', true);

    console.log('FeedPage: Dispatching openLightbox event');
    const event = new CustomEvent('openLightbox', { detail: artwork });
    window.dispatchEvent(event);
    console.log('FeedPage: Event dispatched');
  }

  openUserProfile(artistName) {
    const username = artistName.toLowerCase().replace(/\s+/g, '-');
    console.log('Opening user profile for:', artistName, 'username:', username);
    console.log('Navigating to:', `/user/${username}`);
    router.navigate(`/user/${username}`);
  }
}
