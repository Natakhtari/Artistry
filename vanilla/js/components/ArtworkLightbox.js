import { Component } from './Component.js';
import { stateManager } from '../utils/state.js';
import { api } from '../utils/api.js';
import { toast } from '../utils/toast.js';

export class ArtworkLightbox extends Component {
  constructor() {
    super('lightbox-container');
    this.artwork = null;
    this.comments = [];
    this.commentsLoaded = false;
  }

  setArtwork(artwork) {
    this.artwork = artwork;
    this.comments = [];
    this.commentsLoaded = false;
  }

  async loadComments() {
    if (this.commentsLoaded || !this.artwork?.id) return;
    try {
      const res = await api.comments.listForArtwork(this.artwork.id, { limit: 50 });
      this.commentsLoaded = true;
      const items = res?.data?.items ?? [];
      const container = document.getElementById('comments-container');
      const loading   = document.getElementById('comments-loading');
      if (loading) loading.remove();
      if (!container) return;
      container.innerHTML = '';
      items.forEach(c => container.appendChild(this.createComment(c)));
      if (items.length === 0) {
        container.innerHTML = '<p class="text-sm text-slate-500">No comments yet. Be the first!</p>';
      }
    } catch {
      const loading = document.getElementById('comments-loading');
      if (loading) loading.textContent = 'Could not load comments.';
    }
  }

  render() {
    if (!this.artwork) return this.createElement('div');

    const state = stateManager.getState();
    const isLiked = state.likes[this.artwork.id] || false;
    const likes = isLiked ? this.artwork.likes + 1 : this.artwork.likes;

    const container = this.createElement('div', {
      className: 'fixed inset-0 z-[10001] animate-fade-in',
      id: 'lightbox-root'
    });

    // Backdrop
    const backdrop = this.createElement('div', {
      className: 'fixed inset-0 bg-black/95 z-[10001]'
    });
    backdrop.addEventListener('click', () => this.close());

    // Content Container
    const contentWrapper = this.createElement('div', {
      className: 'fixed inset-0 z-[10001] flex items-center justify-center p-4 md:p-6'
    });
    contentWrapper.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) this.close();
    });

    // Close Button
    const closeButton = this.createElement('button', {
      className: 'absolute top-4 right-4 md:top-6 md:right-6 p-3 bg-slate-900/80 hover:bg-slate-900 rounded-full transition-colors z-[10002]',
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

    // Content — sized by the image, not the viewport
    const content = this.createElement('div', {
      className: 'flex flex-col md:flex-row items-stretch max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl'
    });

    // Image Side — no forced size, wraps the image naturally
    const imageContainer = this.createElement('div', {
      className: 'flex items-center justify-center bg-slate-800/50 p-4 md:p-8'
    });

    const image = this.createElement('img', {
      src: this.artwork.image,
      alt: `${this.artwork.title} — digital artwork by ${this.artwork.artist} on Artistry`,
      className: 'w-auto h-auto max-h-[48vh] md:max-h-[84vh] max-w-[90vw] md:max-w-[55vw] object-contain rounded-2xl shadow-2xl block'
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
      className: 'w-full md:w-96 md:flex-shrink-0 bg-slate-900/95 backdrop-blur-xl border-t md:border-t-0 md:border-l border-slate-800 flex flex-col overflow-hidden'
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

    const loadingMsg = this.createElement('p', {
      className: 'text-sm text-slate-500',
      id: 'comments-loading'
    }, 'Loading comments…');
    commentsContainer.appendChild(loadingMsg);

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
    // Normalise both API shape { username, body, created_at } and legacy { user, text, time }
    const username = comment.username ?? comment.user ?? 'Unknown';
    const bodyText = comment.body     ?? comment.text ?? '';
    const timeStr  = comment.created_at
      ? new Date(comment.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      : (comment.time ?? '');
    const avatarUrl = comment.avatar ?? null;

    const commentDiv = this.createElement('div', {
      className: 'flex gap-3 group',
      'data-comment-id': comment.id
    });

    const avatarContainer = this.createElement('div', {
      className: 'w-8 h-8 rounded-full flex-shrink-0 overflow-hidden bg-slate-700 flex items-center justify-center'
    });

    if (avatarUrl) {
      const avatar = this.createElement('img', {
        src: avatarUrl,
        alt: `${username} avatar`,
        className: 'w-full h-full object-cover'
      });
      avatarContainer.appendChild(avatar);
    } else {
      avatarContainer.textContent = username.charAt(0).toUpperCase();
      avatarContainer.classList.add('text-xs', 'font-bold', 'text-slate-300');
    }

    const commentContent = this.createElement('div', { className: 'flex-1 min-w-0' });

    const text = this.createElement('p', { className: 'text-sm' });
    const userSpan = this.createElement('span', { className: 'font-medium' }, username + ' ');
    const bodySpan = this.createElement('span', { className: 'text-slate-400' }, bodyText);
    text.appendChild(userSpan);
    text.appendChild(bodySpan);

    const footer = this.createElement('div', { className: 'flex items-center gap-3 mt-1' });
    const timeEl = this.createElement('span', { className: 'text-xs text-slate-500' }, timeStr);
    footer.appendChild(timeEl);

    // Show delete button for own comments
    const state = stateManager.getState();
    const currentUser = state?.user;
    if (currentUser && (comment.user_id === currentUser.id || comment.username === currentUser.username)) {
      const delBtn = this.createElement('button', {
        className: 'text-xs text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity'
      }, 'Delete');
      delBtn.addEventListener('click', () => this.deleteComment(comment.id, commentDiv));
      footer.appendChild(delBtn);
    }

    commentContent.appendChild(text);
    commentContent.appendChild(footer);
    commentDiv.appendChild(avatarContainer);
    commentDiv.appendChild(commentContent);

    return commentDiv;
  }

  async deleteComment(commentId, element) {
    try {
      await api.comments.remove(commentId);
      element.remove();
    } catch (err) {
      toast.show(err.message || 'Could not delete comment', 'error');
    }
  }

  handleLike() {
    const state      = stateManager.getState();
    const isLiked    = state.likes[this.artwork.id] || false;
    const current    = isLiked ? this.artwork.likes + 1 : this.artwork.likes;
    const result     = stateManager.toggleLike(this.artwork.id, current);

    // Update lightbox UI
    const likeEl  = document.getElementById('lightbox-likes');
    const likeBtn = document.getElementById('lightbox-like-btn');
    if (likeEl)  likeEl.textContent = result.newLikes.toString();
    if (likeBtn) {
      likeBtn.className = result.isLiked
        ? 'flex items-center gap-2 px-4 py-2 rounded-xl transition-all text-red-500'
        : 'flex items-center gap-2 px-4 py-2 rounded-xl transition-all text-slate-400 hover:text-red-500 hover:bg-slate-800';
    }

    // Mirror on feed card if visible
    const feedLikeEl  = document.getElementById(`likes-${this.artwork.id}`);
    const feedLikeBtn = document.getElementById(`like-btn-${this.artwork.id}`);
    if (feedLikeEl)  feedLikeEl.textContent = result.newLikes.toString();
    if (feedLikeBtn) {
      feedLikeBtn.classList.toggle('text-red-500',  result.isLiked);
      feedLikeBtn.classList.toggle('text-slate-400', !result.isLiked);
    }

    if (window.lucide) window.lucide.createIcons();

    // Sync to backend
    if (stateManager.getToken()) {
      api.likes.toggle('artwork', this.artwork.id).catch(() => { /* non-fatal */ });
    }
  }

  async postComment() {
    const input = document.getElementById('comment-input');
    if (!input?.value.trim()) return;

    const postBtn = document.getElementById('lightbox-post-btn');
    const text = input.value.trim();
    input.value = '';
    if (postBtn) postBtn.disabled = true;

    const state = stateManager.getState();
    if (!state?.user) {
      toast.show('Sign in to leave a comment', 'error');
      input.value = text;
      if (postBtn) postBtn.disabled = false;
      return;
    }

    try {
      const res = await api.comments.createForArtwork(this.artwork.id, { body: text });
      const comment = res?.data ?? {};
      const container = document.getElementById('comments-container');
      if (container) {
        // Remove the "No comments yet" placeholder if present
        const placeholder = container.querySelector('p');
        if (placeholder && placeholder.textContent.includes('No comments')) placeholder.remove();
        container.appendChild(this.createComment(comment));
        container.scrollTop = container.scrollHeight;
      }
    } catch (err) {
      toast.show(err.message || 'Could not post comment', 'error');
      input.value = text;
    } finally {
      if (postBtn) postBtn.disabled = false;
    }
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
    document.body.style.overflow = '';
    stateManager.updateNested('modalState.artworkLightbox', false);
    stateManager.updateNested('modalState.selectedArtwork', null);
  }

  mount() {
    let container = document.getElementById('lightbox-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'lightbox-container';
      document.body.appendChild(container);
    }

    container.innerHTML = '';
    document.body.style.overflow = 'hidden';
    const element = this.render();
    container.appendChild(element);
    this.afterRender();
    this.loadComments();
  }
}

