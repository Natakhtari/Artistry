import { Component } from './Component.js';

export class ContentViewer extends Component {
  constructor(type, data) {
    super('content-viewer-container');
    this.type = type;
    this.data = data;
  }

  render() {
    const backdrop = this.createElement('div', {
      className: 'fixed inset-0 z-50 bg-black/95 animate-fade-in',
      id: 'viewer-backdrop'
    });

    const container = this.createElement('div', {
      className: 'fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none'
    });

    const content = this.createElement('div', {
      className: 'w-full max-w-6xl h-full max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden flex flex-col pointer-events-auto'
    });

    // Header
    const header = this.createHeader();
    content.appendChild(header);

    // Main Content
    const main = this.createElement('div', {
      className: 'flex-1 overflow-y-auto custom-scrollbar p-6'
    });

    if (this.type === 'video') {
      main.appendChild(this.createVideoContent());
    } else if (this.type === 'podcast') {
      main.appendChild(this.createPodcastContent());
    } else if (this.type === 'article') {
      main.appendChild(this.createArticleContent());
    }

    content.appendChild(main);
    container.appendChild(content);
    
    const wrapper = this.createElement('div');
    wrapper.appendChild(backdrop);
    wrapper.appendChild(container);

    return wrapper;
  }

  createHeader() {
    const header = this.createElement('div', {
      className: 'flex items-center justify-between p-4 border-b border-slate-800 flex-shrink-0 z-10'
    });

    const title = this.createElement('h2', {
      className: 'text-xl font-bold truncate flex-1 mr-4'
    }, this.data.title);

    const closeButton = this.createElement('button', {
      className: 'p-2 hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0',
      id: 'viewer-close-btn'
    });
    closeButton.addEventListener('click', (e) => {
      console.log('ContentViewer: Close button clicked');
      e.stopPropagation();
      e.preventDefault();
      this.close();
    });
    const closeIcon = this.createIcon('x', 'w-6 h-6');
    closeButton.appendChild(closeIcon);

    header.appendChild(title);
    header.appendChild(closeButton);

    return header;
  }

  createVideoContent() {
    const container = this.createElement('div', {
      className: 'space-y-6'
    });

    // Video Player
    const videoWrapper = this.createElement('div', {
      className: 'relative'
    });

    const videoContainer = this.createElement('div', {
      className: 'aspect-video bg-black rounded-xl overflow-hidden relative'
    });

    const video = this.createElement('img', {
      src: this.data.thumbnail,
      alt: this.data.title,
      className: 'w-full h-full object-cover'
    });

    const playOverlay = this.createElement('div', {
      className: 'absolute inset-0 flex items-center justify-center bg-black/50'
    });

    const playButton = this.createElement('button', {
      className: 'w-20 h-20 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-colors'
    });
    playButton.addEventListener('click', (e) => {
      e.stopPropagation();
      alert('Video playback would start here. (Demo mode)');
    });
    const playIcon = this.createIcon('play', 'w-10 h-10 ml-1');
    playButton.appendChild(playIcon);
    playOverlay.appendChild(playButton);

    videoContainer.appendChild(video);
    videoContainer.appendChild(playOverlay);
    videoWrapper.appendChild(videoContainer);

    // Info
    const info = this.createElement('div', {
      className: 'space-y-4'
    });

    const artistRow = this.createElement('div', {
      className: 'flex items-center gap-3'
    });

    const avatar = this.createElement('div', {
      className: 'w-12 h-12 rounded-full overflow-hidden bg-slate-700'
    });
    const avatarImg = this.createElement('img', {
      src: this.data.avatar,
      className: 'w-full h-full object-cover'
    });
    avatar.appendChild(avatarImg);

    const artistInfo = this.createElement('div');
    const artistName = this.createElement('div', {
      className: 'font-bold'
    }, this.data.artist);
    const views = this.createElement('div', {
      className: 'text-sm text-slate-400'
    }, `${this.data.views} views • ${this.data.duration}`);
    artistInfo.appendChild(artistName);
    artistInfo.appendChild(views);

    artistRow.appendChild(avatar);
    artistRow.appendChild(artistInfo);

    const description = this.createElement('p', {
      className: 'text-slate-400'
    }, this.data.description);

    info.appendChild(artistRow);
    info.appendChild(description);

    container.appendChild(videoWrapper);
    container.appendChild(info);

    return container;
  }

  createPodcastContent() {
    const container = this.createElement('div', {
      className: 'flex flex-col items-center text-center space-y-6'
    });

    // Cover Art
    const cover = this.createElement('div', {
      className: 'w-64 h-64 rounded-2xl overflow-hidden shadow-2xl bg-slate-700'
    });
    const coverImg = this.createElement('img', {
      src: this.data.cover,
      className: 'w-full h-full object-cover'
    });
    cover.appendChild(coverImg);

    // Info
    const title = this.createElement('h2', {
      className: 'text-3xl font-bold'
    }, this.data.title);

    const artist = this.createElement('p', {
      className: 'text-xl text-primary'
    }, this.data.artist);

    const duration = this.createElement('p', {
      className: 'text-slate-400'
    }, this.data.duration);

    // Play Button
    const playButton = this.createElement('button', {
      className: 'px-8 py-4 bg-primary hover:bg-primary-hover rounded-full font-medium flex items-center gap-2 transition-colors'
    });
    const playIcon = this.createIcon('play', 'w-5 h-5');
    const playText = document.createTextNode('Play Episode');
    playButton.appendChild(playIcon);
    playButton.appendChild(playText);

    const description = this.createElement('p', {
      className: 'text-slate-400 max-w-2xl'
    }, this.data.description);

    container.appendChild(cover);
    container.appendChild(title);
    container.appendChild(artist);
    container.appendChild(duration);
    container.appendChild(playButton);
    container.appendChild(description);

    return container;
  }

  createArticleContent() {
    const container = this.createElement('div', {
      className: 'max-w-3xl mx-auto space-y-6'
    });

    // Hero Image
    const hero = this.createElement('div', {
      className: 'w-full h-96 rounded-2xl overflow-hidden bg-slate-700'
    });
    const heroImg = this.createElement('img', {
      src: this.data.thumbnail,
      className: 'w-full h-full object-cover'
    });
    hero.appendChild(heroImg);

    // Title
    const title = this.createElement('h1', {
      className: 'text-4xl font-bold'
    }, this.data.title);

    // Meta
    const meta = this.createElement('div', {
      className: 'flex items-center gap-4 text-sm text-slate-400'
    });

    const authorSection = this.createElement('div', {
      className: 'flex items-center gap-2'
    });
    const avatar = this.createElement('div', {
      className: 'w-8 h-8 rounded-full overflow-hidden bg-slate-700'
    });
    const avatarImg = this.createElement('img', {
      src: this.data.avatar,
      className: 'w-full h-full object-cover'
    });
    avatar.appendChild(avatarImg);
    const authorName = document.createTextNode(this.data.artist);
    authorSection.appendChild(avatar);
    authorSection.appendChild(authorName);

    const readTime = document.createTextNode(this.data.readTime);

    meta.appendChild(authorSection);
    meta.appendChild(document.createTextNode(' • '));
    meta.appendChild(readTime);

    // Content
    const content = this.createElement('div', {
      className: 'prose prose-invert prose-slate max-w-none'
    });

    const paragraphs = [
      this.data.description,
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
      'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
      'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.'
    ];

    paragraphs.forEach(text => {
      const p = this.createElement('p', {
        className: 'text-slate-300 leading-relaxed mb-4'
      }, text);
      content.appendChild(p);
    });

    container.appendChild(hero);
    container.appendChild(title);
    container.appendChild(meta);
    container.appendChild(content);

    return container;
  }

  close() {
    console.log('ContentViewer: Closing...');
    const container = document.getElementById('content-viewer-container');
    if (container) {
      console.log('ContentViewer: Removing container');
      container.remove();
    } else {
      console.log('ContentViewer: Container not found');
    }
  }

  mount() {
    // Remove any existing viewer
    const existing = document.getElementById('content-viewer-container');
    if (existing) {
      existing.remove();
    }

    const container = document.createElement('div');
    container.id = 'content-viewer-container';
    document.body.appendChild(container);

    const element = this.render();
    container.appendChild(element);
    
    // Add backdrop click handler
    setTimeout(() => {
      const backdrop = document.getElementById('viewer-backdrop');
      if (backdrop) {
        backdrop.addEventListener('click', () => {
          this.close();
        });
      }
    }, 0);

    this.afterRender();
  }
}

