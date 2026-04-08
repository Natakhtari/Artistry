import { Component } from './Component.js';
import { stateManager } from '../utils/state.js';
import { avatars } from '../utils/avatars.js';
import { CreatePostModal } from './CreatePostModal.js';

export class FeedPage extends Component {
  constructor() {
    super('app');
    this.feed = this.generateFeed();
    
    // Listen for new posts from navigation
    window.addEventListener('newPostCreated', (e) => {
      this.addNewPost(e.detail);
    });
  }

  addNewPost(post) {
    console.log('FeedPage: Adding new post to feed:', post);
    this.feed.unshift(post);  // Add to beginning
    this.rerender();
  }

  rerender() {
    const appContainer = document.getElementById('app');
    if (appContainer) {
      appContainer.innerHTML = '';
      this.mount();
    }
  }

  generateFeed() {
    return [
      {
        id: 1,
        type: 'artwork',
        image: 'https://cdn.pixabay.com/photo/2017/01/03/02/07/vine-1948358_960_720.png',
        artist: 'Elena Rodriguez',
        avatar: avatars.elenaRodriguez,
        likes: 342,
        title: 'Abstract Dreams',
        description: 'Exploring the boundaries of color and form'
      },
      {
        id: 2,
        type: 'video',
        thumbnail: 'https://cdn.pixabay.com/photo/2018/03/10/12/00/teamwork-3213924_960_720.jpg',
        artist: 'Marcus Chen',
        avatar: avatars.marcusChen,
        likes: 289,
        views: '12.5K',
        duration: '15:30',
        title: 'Watercolor Techniques Tutorial',
        description: 'Learn professional watercolor painting techniques'
      },
      {
        id: 3,
        type: 'artwork',
        image: 'https://cdn.pixabay.com/photo/2017/08/30/01/05/milky-way-2695569_960_720.jpg',
        artist: 'Sophia Laurent',
        avatar: avatars.sophiaLaurent,
        likes: 567,
        title: 'Natural Beauty',
        description: 'Finding art in nature'
      },
      {
        id: 4,
        type: 'podcast',
        cover: 'https://cdn.pixabay.com/photo/2016/11/18/17/46/house-1836070_960_720.jpg',
        artist: 'Alex Kim',
        avatar: avatars.alexKim,
        likes: 423,
        duration: '45 min',
        title: 'The Art Business Podcast',
        description: 'Building your creative career'
      },
      {
        id: 5,
        type: 'article',
        thumbnail: 'https://cdn.pixabay.com/photo/2016/11/29/03/53/architecture-1867187_960_720.jpg',
        artist: 'Yuki Tanaka',
        avatar: avatars.yukiTanaka,
        likes: 198,
        readTime: '8 min read',
        title: 'Modern Art Trends 2024',
        description: 'Exploring the latest trends in contemporary art'
      },
      {
        id: 6,
        type: 'artwork',
        image: 'https://cdn.pixabay.com/photo/2016/11/29/09/32/concept-1868728_960_720.jpg',
        artist: 'Nina Patel',
        avatar: avatars.ninaPatel,
        likes: 312,
        title: 'Vibrant Colors',
        description: 'A celebration of color and life'
      },
      {
        id: 7,
        type: 'video',
        thumbnail: 'https://cdn.pixabay.com/photo/2015/01/08/18/29/entrepreneur-593358_960_720.jpg',
        artist: 'Carlos Santos',
        avatar: avatars.carlosSantos,
        likes: 456,
        views: '8.2K',
        duration: '10:15',
        title: 'Digital Art Process',
        description: 'Creating stunning digital artwork from scratch'
      },
      {
        id: 8,
        type: 'article',
        thumbnail: 'https://cdn.pixabay.com/photo/2016/11/29/12/13/fence-1869401_960_720.jpg',
        artist: 'Aria Johnson',
        avatar: avatars.ariajohnson,
        likes: 234,
        readTime: '5 min read',
        title: 'Color Theory Basics',
        description: 'Essential guide to understanding color in art'
      }
    ];
  }

  render() {
    const container = this.createElement('div', {
      className: 'min-h-screen pt-20 md:pt-24 pb-20 md:pb-8'
    });

    const contentContainer = this.createElement('div', {
      className: 'max-w-7xl mx-auto px-4 md:px-6'
    });

    // Header
    const header = this.createElement('div', {
      className: 'mb-8'
    });

    const title = this.createElement('h1', {
      className: 'text-3xl md:text-4xl font-bold mb-2'
    }, 'Discover');

    const subtitle = this.createElement('p', {
      className: 'text-slate-400'
    }, 'Artworks, videos, podcasts, and articles from creators worldwide');

    header.appendChild(title);
    header.appendChild(subtitle);

    // Grid
    const grid = this.createElement('div', {
      className: 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
    });

    this.feed.forEach(item => {
      const card = this.createFeedCard(item);
      grid.appendChild(card);
    });

    contentContainer.appendChild(header);
    contentContainer.appendChild(grid);
    container.appendChild(contentContainer);

    return container;
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

    // Image/Thumbnail Container
    const imageContainer = this.createElement('div', {
      className: 'relative aspect-square overflow-hidden bg-slate-700'
    });
    imageContainer.addEventListener('click', () => this.openContent(item));

    const imageUrl = item.image || item.thumbnail || item.cover;
    const image = this.createElement('img', {
      src: imageUrl,
      alt: item.title,
      className: 'w-full h-full object-cover'
    });
    
    // Add error handler with better placeholder
    image.addEventListener('error', (e) => {
      console.warn('Image failed to load:', imageUrl);
      // Use a simple colored SVG as fallback
      e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="500" height="500"%3E%3Crect fill="%231e293b" width="500" height="500"/%3E%3Ctext fill="%2364748b" font-family="sans-serif" font-size="24" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3E' + encodeURIComponent(item.type || 'Image') + '%3C/text%3E%3C/svg%3E';
    });

    imageContainer.appendChild(image);

    // Type Badge
    if (item.type !== 'artwork') {
      const badge = this.createTypeBadge(item);
      imageContainer.appendChild(badge);
    }

    // Duration/Read Time Overlay
    if (item.duration || item.readTime || item.views) {
      const overlay = this.createElement('div', {
        className: 'absolute bottom-2 right-2 px-2 py-1 bg-black/80 rounded text-xs font-medium'
      }, item.duration || item.readTime || '');
      imageContainer.appendChild(overlay);
    }

    // Artist Info
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
      alt: item.artist,
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

    // Like Button
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
    let icon, label, color;
    
    switch(item.type) {
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
      // Open appropriate viewer
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
    
    // Update like count
    const likeElement = document.getElementById(`likes-${itemId}`);
    if (likeElement) {
      likeElement.textContent = result.newLikes.toString();
    }
    
    // Update button styling
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
    // Convert artist name to URL-friendly format
    const username = artistName.toLowerCase().replace(/\s+/g, '-');
    console.log('Opening user profile for:', artistName, 'username:', username);
    console.log('Navigating to:', `/user/${username}`);
    router.navigate(`/user/${username}`);
  }
}
