import { Component } from './Component.js';
import { stateManager } from '../utils/state.js';

export class ArtworkLightbox extends Component {
  constructor() {
    super('lightbox-container');
    this.artwork = null;
    this.comments = [];
    this.commentText = '';
  }

  setArtwork(artwork) {
    this.artwork = artwork;
    this.comments = [
      {
        id: 1,
        user: 'Yuki Tanaka',
        avatar: 'https://i.pravatar.cc/150?img=32',
        text: 'Absolutely stunning work! The color palette is mesmerizing.',
        time: '1 hour ago'
      },
      {
        id: 2,
        user: 'Nina Patel',
        avatar: 'https://i.pravatar.cc/150?img=9',
        text: 'Love the composition and emotional depth!',
        time: '30 minutes ago'
      }
    ];
  }

  render() {
    if (!this.artwork) return this.createElement('div');

    const state = stateManager.getState();
    const isLiked = state.likes[this.artwork.id] || false;
    const likes = isLiked ? this.artwork.likes + 1 : this.artwork.likes;

    const container = this.createElement('div', {
      className: 'fixed inset-0 z-50 animate-fade-in',
      id: 'lightbox-root'
    });

    // Backdrop
    const backdrop = this.createElement('div', {
      className: 'fixed inset-0 bg-black/95 z-50'
    });
    backdrop.addEventListener('click', () => this.close());

    // Content Container
    const contentWrapper = this.createElement('div', {
      className: 'fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6'
    });
    contentWrapper.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) this.close();
    });

    // Close Button
    const closeButton = this.createElement('button', {
      className: 'absolute top-4 right-4 md:top-6 md:right-6 p-3 bg-slate-900/80 hover:bg-slate-900 rounded-full transition-colors z-[60]',
      id: 'lightbox-close-btn'
    });
    closeButton.addEventListener('click', (e) => {
      console.log('ArtworkLightbox: Close button clicked');
      e.stopPropagation();
      e.preventDefault();
      this.close();
    });
    const closeIcon = this.createIcon('x', 'w-6 h-6');
    closeButton.appendChild(closeIcon);

    // Content
    const content = this.createElement('div', {
      className: 'w-full max-w-[1800px] h-full flex flex-col md:flex-row gap-0 md:gap-6 items-center'
    });

    // Image Side
    const imageContainer = this.createElement('div', {
      className: 'flex-1 flex items-center justify-center w-full h-3/5 md:h-full bg-slate-800/50 rounded-3xl p-4 md:p-8'
    });

    const image = this.createElement('img', {
      src: this.artwork.image,
      alt: `${this.artwork.title} — digital artwork by ${this.artwork.artist} on Artistry`,
      className: 'max-h-full max-w-full w-full object-contain rounded-2xl shadow-2xl'
    });

    imageContainer.appendChild(image);

    // Info Panel
    const infoPanel = this.createInfoPanel(likes, isLiked);

    content.appendChild(imageContainer);
    content.appendChild(infoPanel);
    contentWrapper.appendChild(closeButton);
    contentWrapper.appendChild(content);
    container.appendChild(backdrop);
    container.appendChild(contentWrapper);

    return container;
  }

  createInfoPanel(likes, isLiked) {
    const panel = this.createElement('div', {
      className: 'w-full md:w-96 h-2/5 md:h-full bg-slate-900/95 backdrop-blur-xl rounded-t-3xl md:rounded-2xl border-t md:border border-slate-800 flex flex-col overflow-hidden'
    });

    // Artist Info
    const artistSection = this.createElement('div', {
      className: 'p-6 border-b border-slate-800'
    });

    const artistHeader = this.createElement('div', {
      className: 'flex items-center gap-3 mb-4'
    });

    const avatarContainer = this.createElement('div', {
      className: 'w-12 h-12 rounded-full border-2 border-slate-700 overflow-hidden bg-slate-700 flex-shrink-0'
    });

    const avatar = this.createElement('img', {
      src: this.artwork.avatar,
      alt: `Profile photo of ${this.artwork.artist}`,
      className: 'w-full h-full object-cover'
    });

    avatarContainer.appendChild(avatar);

    const artistInfo = this.createElement('div', {
      className: 'flex-1 min-w-0'
    });

    const artistName = this.createElement('h3', {
      className: 'text-lg truncate'
    }, this.artwork.artist);

    const timeAgo = this.createElement('p', {
      className: 'text-sm text-slate-400'
    }, '2 hours ago');

    artistInfo.appendChild(artistName);
    artistInfo.appendChild(timeAgo);
    artistHeader.appendChild(avatarContainer);
    artistHeader.appendChild(artistInfo);

    const title = this.createElement('h2', {
      className: 'text-xl mb-2'
    }, this.artwork.title);

    const description = this.createElement('p', {
      className: 'text-slate-400 text-sm leading-relaxed'
    }, this.artwork.description);

    artistSection.appendChild(artistHeader);
    artistSection.appendChild(title);
    artistSection.appendChild(description);

    // Actions
    const actionsSection = this.createElement('div', {
      className: 'p-6 border-b border-slate-800'
    });

    const actionsContainer = this.createElement('div', {
      className: 'flex items-center gap-4'
    });

    const likeButton = this.createElement('button', {
      className: `flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
        isLiked ? 'text-red-500' : 'text-slate-400 hover:text-red-500 hover:bg-slate-800'
      }`,
      id: 'lightbox-like-btn'
    });
    likeButton.addEventListener('click', () => this.handleLike());

    const heartIcon = this.createIcon('heart', `w-5 h-5 ${isLiked ? 'fill-current' : ''}`);
    const likeCount = this.createElement('span', { id: 'lightbox-likes' }, likes.toString());
    likeButton.appendChild(heartIcon);
    likeButton.appendChild(likeCount);

    actionsContainer.appendChild(likeButton);
    actionsSection.appendChild(actionsContainer);

    // Comments
    const commentsSection = this.createElement('div', {
      className: 'flex-1 overflow-y-auto p-6 custom-scrollbar'
    });

    const commentsTitle = this.createElement('h3', {
      className: 'text-sm text-slate-400 mb-4'
    }, 'Comments');

    const commentsContainer = this.createElement('div', {
      className: 'space-y-4',
      id: 'comments-container'
    });

    this.comments.forEach(comment => {
      const commentElement = this.createComment(comment);
      commentsContainer.appendChild(commentElement);
    });

    commentsSection.appendChild(commentsTitle);
    commentsSection.appendChild(commentsContainer);

    // Comment Input
    const inputSection = this.createElement('div', {
      className: 'p-4 border-t border-slate-800'
    });

    const inputContainer = this.createElement('div', {
      className: 'flex gap-2'
    });

    const input = this.createElement('input', {
      type: 'text',
      placeholder: 'Add a comment...',
      className: 'flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:border-primary transition-colors text-sm',
      id: 'comment-input'
    });
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.postComment();
    });

    const postButton = this.createElement('button', {
      className: 'px-4 py-2 bg-primary hover:bg-primary-hover rounded-xl transition-colors text-sm',
      id: 'lightbox-post-btn'
    }, 'Post');
    postButton.addEventListener('click', (e) => {
      console.log('ArtworkLightbox: Post button clicked');
      e.stopPropagation();
      e.preventDefault();
      this.postComment();
    });

    inputContainer.appendChild(input);
    inputContainer.appendChild(postButton);
    inputSection.appendChild(inputContainer);

    panel.appendChild(artistSection);
    panel.appendChild(actionsSection);
    panel.appendChild(commentsSection);
    panel.appendChild(inputSection);

    return panel;
  }

  createComment(comment) {
    const commentDiv = this.createElement('div', {
      className: 'flex gap-3'
    });

    const avatarContainer = this.createElement('div', {
      className: 'w-8 h-8 rounded-full flex-shrink-0 overflow-hidden bg-slate-700'
    });

    const avatar = this.createElement('img', {
      src: comment.avatar,
      alt: `${comment.user}, commenter on Artistry`,
      className: 'w-full h-full object-cover'
    });

    avatarContainer.appendChild(avatar);

    const commentContent = this.createElement('div', {
      className: 'flex-1 min-w-0'
    });

    const text = this.createElement('p', {
      className: 'text-sm'
    });

    const userName = this.createElement('span', {
      className: 'font-medium'
    }, comment.user + ' ');

    const commentText = this.createElement('span', {
      className: 'text-slate-400'
    }, comment.text);

    text.appendChild(userName);
    text.appendChild(commentText);

    const time = this.createElement('p', {
      className: 'text-xs text-slate-500 mt-1'
    }, comment.time);

    commentContent.appendChild(text);
    commentContent.appendChild(time);
    commentDiv.appendChild(avatarContainer);
    commentDiv.appendChild(commentContent);

    return commentDiv;
  }

  handleLike() {
    console.log('ArtworkLightbox: handleLike called');
    const state = stateManager.getState();
    const isLiked = state.likes[this.artwork.id] || false;
    const currentLikes = isLiked ? this.artwork.likes + 1 : this.artwork.likes;
    
    const result = stateManager.toggleLike(this.artwork.id, currentLikes);
    console.log('ArtworkLightbox: Like toggled. New state:', result);
    
    // Update UI - like count
    const likeElement = document.getElementById('lightbox-likes');
    if (likeElement) {
      likeElement.textContent = result.newLikes.toString();
    }

    // Update UI - button styling
    const likeButton = document.getElementById('lightbox-like-btn');
    if (likeButton) {
      if (result.isLiked) {
        likeButton.className = 'flex items-center gap-2 px-4 py-2 rounded-xl transition-all text-red-500';
      } else {
        likeButton.className = 'flex items-center gap-2 px-4 py-2 rounded-xl transition-all text-slate-400 hover:text-red-500 hover:bg-slate-800';
      }
    }

    // Update main feed if visible
    const feedLikeElement = document.getElementById(`likes-${this.artwork.id}`);
    if (feedLikeElement) {
      feedLikeElement.textContent = result.newLikes.toString();
    }
    
    // Update feed like button styling
    const feedLikeButton = document.getElementById(`like-btn-${this.artwork.id}`);
    if (feedLikeButton) {
      if (result.isLiked) {
        feedLikeButton.classList.add('text-red-500');
        feedLikeButton.classList.remove('text-slate-400');
      } else {
        feedLikeButton.classList.remove('text-red-500');
        feedLikeButton.classList.add('text-slate-400');
      }
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  postComment() {
    console.log('ArtworkLightbox: postComment called');
    const input = document.getElementById('comment-input');
    if (!input) {
      console.log('ArtworkLightbox: Input not found');
      return;
    }
    if (!input.value.trim()) {
      console.log('ArtworkLightbox: Input is empty');
      return;
    }

    console.log('ArtworkLightbox: Adding comment:', input.value);
    const newComment = {
      id: this.comments.length + 1,
      user: 'You',
      avatar: 'https://i.pravatar.cc/150?img=68',
      text: input.value,
      time: 'Just now'
    };

    this.comments.push(newComment);
    
    const commentsContainer = document.getElementById('comments-container');
    if (commentsContainer) {
      const commentElement = this.createComment(newComment);
      commentsContainer.appendChild(commentElement);
      console.log('ArtworkLightbox: Comment added to DOM');
      
      if (window.lucide) {
        window.lucide.createIcons();
      }
    } else {
      console.log('ArtworkLightbox: Comments container not found');
    }

    input.value = '';
  }

  close() {
    console.log('ArtworkLightbox: Closing...');
    const lightbox = document.getElementById('lightbox-root');
    if (lightbox) {
      console.log('ArtworkLightbox: Removing lightbox');
      lightbox.remove();
    } else {
      console.log('ArtworkLightbox: Lightbox not found');
    }
    stateManager.updateNested('modalState.artworkLightbox', false);
    stateManager.updateNested('modalState.selectedArtwork', null);
  }

  mount() {
    console.log('ArtworkLightbox: mount() called');
    let container = document.getElementById('lightbox-container');
    
    if (!container) {
      console.log('ArtworkLightbox: Creating lightbox-container');
      container = document.createElement('div');
      container.id = 'lightbox-container';
      document.body.appendChild(container);
    } else {
      console.log('ArtworkLightbox: lightbox-container already exists');
    }

    container.innerHTML = '';
    console.log('ArtworkLightbox: Rendering...');
    const element = this.render();
    console.log('ArtworkLightbox: Element rendered');
    container.appendChild(element);
    console.log('ArtworkLightbox: Element appended to container');
    this.afterRender();
    console.log('ArtworkLightbox: afterRender() complete');
  }
}

