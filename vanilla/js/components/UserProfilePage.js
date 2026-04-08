import { Component } from './Component.js';
import { router } from '../router.js';
import { stateManager } from '../utils/state.js';
import { EditProfileModal } from './EditProfileModal.js';
import { avatars } from '../utils/avatars.js';

export class UserProfilePage extends Component {
  constructor(username) {
    super('app');
    this.username = username;
    this.user = this.getUserData(username);
  }

  getUserData(username) {
    // Mock user data - in real app this would come from API
    const users = {
      'elena-rodriguez': {
        name: 'Elena Rodriguez',
        username: '@elenarod',
        avatar: avatars.elenaRodriguez,
        bio: 'Contemporary artist & painter. Creating vivid abstract artworks.',
        followers: 15247,
        following: 892,
        artworks: 234
      },
      'marcus-chen': {
        name: 'Marcus Chen',
        username: '@marcusc',
        avatar: avatars.marcusChen,
        bio: 'Digital artist exploring the intersection of technology and art.',
        followers: 12853,
        following: 456,
        artworks: 189
      },
      'sophia-laurent': {
        name: 'Sophia Laurent',
        username: '@sophial',
        avatar: avatars.sophiaLaurent,
        bio: 'Photographer capturing beauty in everyday moments.',
        followers: 18529,
        following: 1203,
        artworks: 412
      }
    };

    return users[username] || users['elena-rodriguez'];
  }

  getSeoContext() {
    return { profileName: this.user?.name || '' };
  }

  render() {
    const container = this.createElement('div', {
      className:
        'min-h-screen pb-16 md:pb-8 pt-[max(1rem,env(safe-area-inset-top))] md:pt-20'
    });

    const contentContainer = this.createElement('div', {
      className: 'max-w-5xl mx-auto px-4 md:px-6'
    });

    // Back Button
    const backButton = this.createElement('button', {
      className: 'flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-3'
    });
    backButton.addEventListener('click', () => router.navigate('/feed'));
    const backIcon = this.createIcon('arrow-left', 'w-5 h-5');
    const backText = document.createTextNode('Back to Feed');
    backButton.appendChild(backIcon);
    backButton.appendChild(backText);

    // Profile Header
    const header = this.createProfileHeader(this.user);
    
    // Tabs
    const tabs = this.createTabs();
    
    // Portfolio Grid
    const portfolio = this.createPortfolio();

    contentContainer.appendChild(backButton);
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
      alt: `Profile photo of ${user.name}, Artistry portfolio`,
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

    const followButton = this.createElement('button', {
      className: 'flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover rounded-xl transition-all hover:scale-105 font-medium'
    });
    followButton.addEventListener('click', () => alert('Following ' + user.name));
    const followIcon = this.createIcon('user-plus', 'w-4 h-4');
    const followText = document.createTextNode('Follow');
    followButton.appendChild(followIcon);
    followButton.appendChild(followText);

    const messageButton = this.createElement('button', {
      className: 'flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl transition-all hover:scale-105 font-medium'
    });
    messageButton.addEventListener('click', () => router.navigate('/messages'));
    const messageIcon = this.createIcon('message-circle', 'w-4 h-4');
    const messageText = document.createTextNode('Message');
    messageButton.appendChild(messageIcon);
    messageButton.appendChild(messageText);

    buttons.appendChild(followButton);
    buttons.appendChild(messageButton);

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
      { name: 'Collections', icon: 'bookmark' }
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

    // Mock artworks
    const artworks = [
      'https://cdn.pixabay.com/photo/2016/11/21/12/42/beard-1845166_960_720.jpg',
      'https://cdn.pixabay.com/photo/2016/11/29/09/38/adult-1868750_960_720.jpg',
      'https://cdn.pixabay.com/photo/2017/08/01/08/29/woman-2563491_960_720.jpg',
      'https://cdn.pixabay.com/photo/2015/03/26/09/47/sky-690293_960_720.jpg',
      'https://cdn.pixabay.com/photo/2016/02/19/11/19/office-1209640_960_720.jpg',
      'https://cdn.pixabay.com/photo/2017/08/10/08/47/laptop-2620118_960_720.jpg'
    ];

    artworks.forEach((src, index) => {
      const card = this.createElement('div', {
        className: 'aspect-square bg-slate-800 rounded-xl overflow-hidden cursor-pointer hover:scale-105 transition-all'
      });

      const image = this.createElement('img', {
        src,
        alt: `Portfolio artwork ${index + 1} by ${this.user.name} on Artistry`,
        className: 'w-full h-full object-cover'
      });

      card.appendChild(image);
      grid.appendChild(card);
    });

    return grid;
  }
}

