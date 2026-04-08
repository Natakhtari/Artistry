import { Component } from './Component.js';
import { router } from '../router.js';

export class LandingPage extends Component {
  render() {
    const container = this.createElement('div', {
      className: 'min-h-screen'
    });

    // Hero Section
    const hero = this.createHeroSection();
    
    // Features Section
    const features = this.createFeaturesSection();
    
    // Artists Section
    const artists = this.createArtistsSection();
    
    // CTA Section
    const cta = this.createCTASection();

    container.appendChild(hero);
    container.appendChild(features);
    container.appendChild(artists);
    container.appendChild(cta);

    return container;
  }

  createHeroSection() {
    const section = this.createElement('section', {
      className: 'relative min-h-screen flex items-center justify-center px-4 pt-20 md:pt-32 pb-20 bg-gradient-to-b from-slate-900 via-slate-900 to-transparent'
    });

    const container = this.createElement('div', {
      className: 'max-w-6xl mx-auto text-center animate-slide-up'
    });

    const title = this.createElement('h1', {
      className: 'text-5xl md:text-7xl lg:text-8xl font-bold mb-6 gradient-text'
    }, 'Welcome to Artistry');

    const subtitle = this.createElement('p', {
      className: 'text-xl md:text-2xl text-slate-300 mb-12 max-w-3xl mx-auto'
    }, 'Join the creative revolution. Share your art, discover inspiration, and connect with artists worldwide.');

    const buttonContainer = this.createElement('div', {
      className: 'flex flex-col sm:flex-row gap-4 justify-center items-center'
    });

    const getStartedBtn = this.createElement('button', {
      className: 'px-8 py-4 bg-primary hover:bg-primary-hover rounded-xl text-lg font-medium transition-all hover-scale'
    }, 'Get Started');
    getStartedBtn.addEventListener('click', () => router.navigate('/auth'));

    const learnMoreBtn = this.createElement('button', {
      className: 'px-8 py-4 bg-slate-800 hover:bg-slate-700 rounded-xl text-lg font-medium transition-all'
    }, 'Learn More');
    learnMoreBtn.addEventListener('click', () => {
      document.getElementById('features').scrollIntoView({ behavior: 'smooth' });
    });

    buttonContainer.appendChild(getStartedBtn);
    buttonContainer.appendChild(learnMoreBtn);
    container.appendChild(title);
    container.appendChild(subtitle);
    container.appendChild(buttonContainer);
    section.appendChild(container);

    return section;
  }

  createFeaturesSection() {
    const section = this.createElement('section', {
      id: 'features',
      className: 'py-20 px-4'
    });

    const container = this.createElement('div', {
      className: 'max-w-7xl mx-auto'
    });

    const title = this.createElement('h2', {
      className: 'text-4xl md:text-5xl font-bold text-center mb-16'
    }, 'Features');

    const grid = this.createElement('div', {
      className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'
    });

    const features = [
      {
        icon: 'palette',
        title: 'Showcase Your Art',
        description: 'Upload and share your creative works with a global audience'
      },
      {
        icon: 'users',
        title: 'Connect & Collaborate',
        description: 'Network with fellow artists and creative professionals'
      },
      {
        icon: 'trending-up',
        title: 'Grow Your Audience',
        description: 'Build your following and expand your creative influence'
      },
      {
        icon: 'video',
        title: 'Video Content',
        description: 'Share tutorials, timelapses, and creative processes'
      },
      {
        icon: 'mic',
        title: 'Podcasts & Audio',
        description: 'Listen to art discussions and creative insights'
      },
      {
        icon: 'book-open',
        title: 'Articles & News',
        description: 'Stay updated with the latest in the art world'
      }
    ];

    features.forEach(feature => {
      const card = this.createElement('div', {
        className: 'bg-slate-800 p-8 rounded-2xl hover:bg-slate-700 transition-all card-hover'
      });

      const icon = this.createIcon(feature.icon, 'w-12 h-12 text-primary mb-4');
      const title = this.createElement('h3', {
        className: 'text-2xl font-bold mb-3'
      }, feature.title);
      const desc = this.createElement('p', {
        className: 'text-slate-400'
      }, feature.description);

      card.appendChild(icon);
      card.appendChild(title);
      card.appendChild(desc);
      grid.appendChild(card);
    });

    container.appendChild(title);
    container.appendChild(grid);
    section.appendChild(container);

    return section;
  }

  createArtistsSection() {
    const section = this.createElement('section', {
      className: 'py-20 px-4 bg-slate-800/30'
    });

    const container = this.createElement('div', {
      className: 'max-w-7xl mx-auto'
    });

    const title = this.createElement('h2', {
      className: 'text-4xl md:text-5xl font-bold text-center mb-16'
    }, 'Featured Artists');

    const grid = this.createElement('div', {
      className: 'grid grid-cols-2 md:grid-cols-4 gap-6'
    });

    const artists = [
      { name: 'Elena Rodriguez', avatar: 'https://i.pravatar.cc/150?img=1', followers: '15.2K' },
      { name: 'Marcus Chen', avatar: 'https://i.pravatar.cc/150?img=12', followers: '12.8K' },
      { name: 'Sophia Laurent', avatar: 'https://i.pravatar.cc/150?img=5', followers: '18.5K' },
      { name: 'Alex Kim', avatar: 'https://i.pravatar.cc/150?img=13', followers: '10.3K' }
    ];

    artists.forEach(artist => {
      const card = this.createElement('div', {
        className: 'bg-slate-800 p-6 rounded-2xl text-center hover:bg-slate-700 transition-all card-hover cursor-pointer'
      });

      card.addEventListener('click', () => {
        console.log('Artist card clicked:', artist.name);
        const username = artist.name.toLowerCase().replace(/\s+/g, '-');
        console.log('Navigating to:', `/user/${username}`);
        router.navigate(`/user/${username}`);
      });

      const avatarContainer = this.createElement('div', {
        className: 'w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden bg-slate-700'
      });

      const avatar = this.createElement('img', {
        src: artist.avatar,
        alt: artist.name,
        className: 'w-full h-full object-cover'
      });

      const name = this.createElement('h3', {
        className: 'font-bold mb-1'
      }, artist.name);

      const followers = this.createElement('p', {
        className: 'text-sm text-slate-400'
      }, `${artist.followers} followers`);

      avatarContainer.appendChild(avatar);
      card.appendChild(avatarContainer);
      card.appendChild(name);
      card.appendChild(followers);
      grid.appendChild(card);
    });

    container.appendChild(title);
    container.appendChild(grid);
    section.appendChild(container);

    return section;
  }

  createCTASection() {
    const section = this.createElement('section', {
      className: 'py-32 px-4'
    });

    const container = this.createElement('div', {
      className: 'max-w-4xl mx-auto text-center'
    });

    const title = this.createElement('h2', {
      className: 'text-4xl md:text-6xl font-bold mb-6'
    }, 'Ready to Start Creating?');

    const subtitle = this.createElement('p', {
      className: 'text-xl text-slate-300 mb-12'
    }, 'Join thousands of artists sharing their work on Artistry');

    const button = this.createElement('button', {
      className: 'px-10 py-5 bg-primary hover:bg-primary-hover rounded-xl text-lg font-medium transition-all hover-scale'
    }, 'Join Now');
    button.addEventListener('click', () => router.navigate('/auth'));

    container.appendChild(title);
    container.appendChild(subtitle);
    container.appendChild(button);
    section.appendChild(container);

    return section;
  }
}

