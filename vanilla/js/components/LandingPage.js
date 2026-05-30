import { Component } from './Component.js';
import { router } from '../router.js';
import { api } from '../utils/api.js';

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
      className:
        'relative min-h-screen flex items-center justify-center px-4 pb-16 bg-gradient-to-b from-slate-900 via-slate-900 to-transparent pt-[max(1.125rem,env(safe-area-inset-top))] md:pt-20'
    });

    const container = this.createElement('div', {
      className: 'max-w-6xl mx-auto text-center animate-slide-up'
    });

    const title = this.createElement('h1', {
      className: 'text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold mb-6 gradient-text leading-tight'
    }, 'The Narrative Portfolio Platform for Visual Artists');

    const subtitle = this.createElement('p', {
      className: 'text-lg md:text-2xl text-slate-300 mb-12 max-w-3xl mx-auto'
    }, 'The best portfolio site for artists — ad-free, deep context, and discovery without the algorithm.');

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
      className: 'py-20 w-full overflow-x-hidden'
    });

    const container = this.createElement('div', {
      className:
        'w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 box-border'
    });

    const title = this.createElement('h2', {
      className: 'text-4xl md:text-5xl font-bold text-center mb-10 md:mb-14'
    }, 'Features');

    const grid = this.createElement('div', {
      className:
        'grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 justify-items-stretch'
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
        className:
          'bg-slate-800 p-6 sm:p-8 rounded-2xl hover:bg-slate-700 transition-all card-hover h-full min-w-0 w-full flex flex-col'
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
      className: 'py-20 w-full overflow-x-hidden bg-slate-800/30'
    });

    const container = this.createElement('div', {
      className: 'w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 box-border'
    });

    const title = this.createElement('h2', {
      className: 'text-4xl md:text-5xl font-bold text-center mb-16'
    }, 'Featured Artists');

    const grid = this.createElement('div', {
      id: 'landing-featured-artists',
      className:
        'grid w-full grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6 sm:gap-x-6 sm:gap-y-6 justify-items-stretch'
    });

    grid.appendChild(
      this.createElement('div', {
        className: 'col-span-full text-center text-slate-400 text-sm py-6',
        id: 'landing-artists-status'
      }, 'Loading creators…')
    );

    container.appendChild(title);
    container.appendChild(grid);
    section.appendChild(container);

    return section;
  }

  afterRender() {
    super.afterRender();
    const grid = document.getElementById('landing-featured-artists');
    const status = document.getElementById('landing-artists-status');
    if (!grid) return;

    api.users
      .list({ limit: 8, offset: 0 })
      .then((res) => {
        const items = res?.data?.items ?? [];
        grid.innerHTML = '';
        if (status) status.remove();

        if (items.length === 0) {
          grid.appendChild(
            this.createElement(
              'p',
              { className: 'col-span-full text-center text-slate-400 text-sm py-6' },
              'Creators will appear here as people join the community.'
            )
          );
          if (window.lucide) window.lucide.createIcons();
          return;
        }

        const fmtFollowers = (n) => {
          const x = Number(n) || 0;
          if (x >= 1_000_000) return `${(x / 1_000_000).toFixed(1)}M`;
          if (x >= 1_000) return `${(x / 1_000).toFixed(1)}K`;
          return String(x);
        };

        items.forEach((u) => {
          const display =
            (u.display_name && String(u.display_name).trim()) || u.username || 'Creator';
          const card = this.createElement('div', {
            className:
              'bg-slate-800 p-6 rounded-2xl text-center hover:bg-slate-700 transition-all card-hover cursor-pointer'
          });
          card.addEventListener('click', () => {
            if (u.username) router.navigate(`/user/${encodeURIComponent(u.username)}`);
          });

          const avatarContainer = this.createElement('div', {
            className:
              'w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden bg-slate-700 flex items-center justify-center text-2xl font-bold text-slate-400'
          });
          if (u.profile_picture_url) {
            const avatar = this.createElement('img', {
              src:       u.profile_picture_url,
              alt:       `${display} on Artistry`,
              className: 'w-full h-full object-cover'
            });
            avatar.addEventListener('error', () => {
              avatar.remove();
              avatarContainer.textContent = (u.username || '?').charAt(0).toUpperCase();
            });
            avatarContainer.appendChild(avatar);
          } else {
            avatarContainer.textContent = (u.username || '?').charAt(0).toUpperCase();
          }

          card.appendChild(avatarContainer);
          card.appendChild(
            this.createElement('h3', { className: 'font-bold mb-1 truncate px-1' }, display)
          );
          card.appendChild(
            this.createElement('p', { className: 'text-xs text-slate-500 mb-1 truncate px-1' }, `@${u.username}`)
          );
          card.appendChild(
            this.createElement('p', { className: 'text-sm text-slate-400' }, `${fmtFollowers(u.followers_count)} followers`)
          );
          grid.appendChild(card);
        });
        if (window.lucide) window.lucide.createIcons();
      })
      .catch(() => {
        grid.innerHTML = '';
        if (status) status.remove();
        grid.appendChild(
          this.createElement(
            'p',
            { className: 'col-span-full text-center text-slate-400 text-sm py-6' },
            'Could not load creators. Try again later.'
          )
        );
      });
  }

  createCTASection() {
    const section = this.createElement('section', {
      className: 'py-32 w-full overflow-x-hidden'
    });

    const container = this.createElement('div', {
      className: 'w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 box-border text-center'
    });

    const title = this.createElement('h2', {
      className: 'text-4xl md:text-6xl font-bold mb-6'
    }, 'Ready to Start Creating?');

    const subtitle = this.createElement('p', {
      className: 'text-xl text-slate-300 mb-12'
    }, 'Join artists publishing portfolios, process, and stories on Artistry.');

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

