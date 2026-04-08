// Simple state management
class StateManager {
  constructor() {
    this.state = {
      currentUser: {
        name: 'Alex Chen',
        username: '@alexchen',
        avatar: 'https://i.pravatar.cc/150?img=68',
        bio: 'Digital artist & creative director',
        followers: 2847,
        following: 392,
        artworks: 156
      },
      isAuthenticated: false,
      likes: {},
      savedPosts: [],
      notifications: [],
      currentRoute: '/',
      modalState: {
        editProfile: false,
        artworkLightbox: false,
        selectedArtwork: null
      }
    };
    this.listeners = [];
  }

  getState() {
    return this.state;
  }

  setState(updates) {
    this.state = { ...this.state, ...updates };
    this.notify();
  }

  updateNested(path, value) {
    const keys = path.split('.');
    const newState = { ...this.state };
    let current = newState;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current[keys[i]] = { ...current[keys[i]] };
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    this.state = newState;
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(listener => listener(this.state));
  }

  // Helper methods
  toggleLike(artworkId, currentLikes) {
    const likes = { ...this.state.likes };
    const isLiked = likes[artworkId];
    
    if (isLiked) {
      delete likes[artworkId];
    } else {
      likes[artworkId] = true;
    }
    
    this.setState({ likes });
    return { isLiked: !isLiked, newLikes: isLiked ? currentLikes - 1 : currentLikes + 1 };
  }

  savePost(postId) {
    const savedPosts = [...this.state.savedPosts];
    const index = savedPosts.indexOf(postId);
    
    if (index > -1) {
      savedPosts.splice(index, 1);
    } else {
      savedPosts.push(postId);
    }
    
    this.setState({ savedPosts });
  }

  isPostSaved(postId) {
    return this.state.savedPosts.includes(postId);
  }
}

export const stateManager = new StateManager();

