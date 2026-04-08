import { Component } from './Component.js';
import { stateManager } from '../utils/state.js';
import { router } from '../router.js';
import { EditProfileModal } from './EditProfileModal.js';

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
      className: 'w-full h-full rounded-full overflow-hidden bg-slate-700 border-4 border-slate-900'
    });

    const avatar = this.createElement('img', {
      src: user.avatar,
      alt: `Profile photo of ${user.name}, Artistry creator`,
      className: 'w-full h-full object-cover'
    });

    avatarInner.appendChild(avatar);
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
      className: 'text-slate-300 mb-6 max-w-2xl'
    }, user.bio);

    // Stats in cards
    const statsContainer = this.createElement('div', {
      className: 'grid grid-cols-3 gap-4 mb-6'
    });

    const statsData = [
      { label: 'Artworks', value: user.artworks, icon: 'image' },
      { label: 'Followers', value: user.followers, icon: 'users' },
      { label: 'Following', value: user.following, icon: 'user-plus' }
    ];

    statsData.forEach(stat => {
      const statCard = this.createElement('div', {
        className: 'bg-slate-800/50 rounded-xl p-4 text-center border border-slate-700 hover:border-primary transition-colors cursor-pointer'
      });

      const icon = this.createIcon(stat.icon, 'w-5 h-5 mx-auto mb-2 text-primary');
      const value = this.createElement('div', {
        className: 'text-2xl font-bold mb-1'
      }, stat.value.toString());
      const label = this.createElement('div', {
        className: 'text-sm text-slate-400'
      }, stat.label);

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
    const grid = this.createElement('div', {
      className: 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
    });

    // User's own artworks with data for lightbox
    const artworks = [
      { id: 101, image: 'https://cdn.pixabay.com/photo/2018/01/14/23/12/nature-3082832_960_720.jpg', title: 'Abstract Dreams', description: 'Exploring vibrant colors and forms' },
      { id: 102, image: 'https://cdn.pixabay.com/photo/2017/02/01/22/02/mountain-landscape-2031539_960_720.jpg', title: 'UrbanScape', description: 'City life in motion' },
      { id: 103, image: 'https://cdn.pixabay.com/photo/2015/12/01/20/28/road-1072821_960_720.jpg', title: 'Nature\'s Canvas', description: 'Beauty in simplicity' },
      { id: 104, image: 'https://cdn.pixabay.com/photo/2016/11/29/05/45/astronomy-1867616_960_720.jpg', title: 'Digital Fusion', description: 'Where tech meets art' },
      { id: 105, image: 'https://cdn.pixabay.com/photo/2015/06/19/21/24/the-road-815297_960_720.jpg', title: 'Minimalist View', description: 'Less is more' },
      { id: 106, image: 'https://cdn.pixabay.com/photo/2018/08/14/13/23/ocean-3605547_960_720.jpg', title: 'Color Symphony', description: 'A dance of hues' },
      { id: 107, image: 'https://cdn.pixabay.com/photo/2016/05/05/02/37/sunset-1373171_960_720.jpg', title: 'Modern Art', description: 'Contemporary expression' },
      { id: 108, image: 'https://cdn.pixabay.com/photo/2017/12/15/13/51/polynesia-3021072_960_720.jpg', title: 'Artistic Vision', description: 'Through the lens' },
      { id: 109, image: 'https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_960_720.jpg', title: 'Creative Flow', description: 'Letting ideas flow' }
    ];

    artworks.forEach((artwork) => {
      const likes = Math.floor(Math.random() * 500 + 100);
      const comments = Math.floor(Math.random() * 50 + 10);

      const card = this.createElement('div', {
        className: 'aspect-square bg-slate-800 rounded-xl overflow-hidden cursor-pointer hover:scale-105 transition-all relative group'
      });
      card.addEventListener('click', () => this.openArtworkLightbox({
        ...artwork,
        artist: stateManager.getState().currentUser.name,
        avatar: stateManager.getState().currentUser.avatar,
        likes,
        comments,
        isLiked: false
      }));

      const artistName = stateManager.getState().currentUser.name;
      const image = this.createElement('img', {
        src: artwork.image,
        alt: `${artwork.title} — portfolio artwork by ${artistName} on Artistry`,
        className: 'w-full h-full object-cover'
      });

      // Overlay with stats
      const overlay = this.createElement('div', {
        className: 'absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4'
      });

      const stats = this.createElement('div', {
        className: 'flex items-center justify-between'
      });

      const likesDiv = this.createElement('div', {
        className: 'flex items-center gap-1 text-white'
      });
      const heartIcon = this.createIcon('heart', 'w-5 h-5');
      const likeCount = this.createElement('span', { className: 'font-medium' }, likes.toString());
      likesDiv.appendChild(heartIcon);
      likesDiv.appendChild(likeCount);

      const commentsDiv = this.createElement('div', {
        className: 'flex items-center gap-1 text-white'
      });
      const commentIcon = this.createIcon('message-circle', 'w-5 h-5');
      const commentCount = this.createElement('span', { className: 'font-medium' }, comments.toString());
      commentsDiv.appendChild(commentIcon);
      commentsDiv.appendChild(commentCount);

      stats.appendChild(likesDiv);
      stats.appendChild(commentsDiv);
      overlay.appendChild(stats);

      card.appendChild(image);
      card.appendChild(overlay);
      grid.appendChild(card);
    });

    return grid;
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

