// Main Application Entry Point
import { router } from './router.js';
import { stateManager } from './utils/state.js';
import { api } from './utils/api.js';
import { applyRouteSeo } from './utils/seo.js';
import { Navigation } from './components/Navigation.js';
import { LandingPage } from './components/LandingPage.js';
import { FeedPage } from './components/FeedPage.js';
import { ProfilePage } from './components/ProfilePage.js';
import { UserProfilePage } from './components/UserProfilePage.js';
import { MessagesPage } from './components/MessagesPage.js';
import { NotificationsPage } from './components/NotificationsPage.js';
import { SettingsPage } from './components/SettingsPage.js';
import { NewsPage } from './components/NewsPage.js';
import { AuthPage } from './components/AuthPage.js';
import { ArtworkLightbox } from './components/ArtworkLightbox.js';
import { ContentViewer } from './components/ContentViewer.js';

class App {
  constructor() {
    console.log('App constructor called');
    this.navigation = new Navigation();
    this.currentPage = null;
    console.log('About to call init()');
    this.init();
  }

  async init() {
    // Register all routes
    router.register('/', () => this.renderPage(LandingPage));
    router.register('/auth', () => this.renderPage(AuthPage, true));
    router.register('/feed', () => this.checkAuth(() => this.renderPage(FeedPage)));
    router.register('/profile', () => this.checkAuth(() => this.renderPage(ProfilePage)));

    // Public — no auth required; the page itself handles the logged-in/out difference
    router.register('/user/:username', (params) => {
      this.renderPage(UserProfilePage, false, params.username);
    });

    router.register('/messages',          ()       => this.checkAuth(() => this.renderPage(MessagesPage)));
    router.register('/messages/:chatId',  (params) => this.checkAuth(() => this.renderPage(MessagesPage, false, params.chatId)));
    router.register('/notifications',     ()       => this.checkAuth(() => this.renderPage(NotificationsPage)));
    router.register('/settings',          ()       => this.checkAuth(() => this.renderPage(SettingsPage)));
    router.register('/news',              ()       => this.renderPage(NewsPage));

    // Subscribe to state changes
    stateManager.subscribe((state) => this.handleStateChange(state));

    // Listen for modal open events
    window.addEventListener('openLightbox',      (e) => this.openLightbox(e.detail));
    window.addEventListener('openContentViewer', (e) => this.openContentViewer(e.detail));

    // Silently restore auth before the first render so checkAuth works correctly
    // on a hard refresh even when only the refresh token remains.
    if (stateManager.getToken()) {
      try {
        const res = await api.auth.me();
        stateManager.setUser(res.data);
      } catch {
        stateManager.clearAuth();
      }
    }

    // Navigate to the current URL path
    const path = window.location.pathname;
    if (path.includes('/vanilla')) {
      router.navigate('/', true);
    } else {
      router.navigate(path, false);
    }
  }

  checkAuth(callback) {
    const state = stateManager.getState();
    console.log('Checking auth. isAuthenticated:', state.isAuthenticated);
    if (!state.isAuthenticated) {
      console.log('Not authenticated, redirecting to /auth');
      router.navigate('/auth', true);
      return;
    }
    console.log('Authenticated, calling callback');
    callback();
  }

  renderPage(PageClass, hideNav = false, ...args) {
    console.log('renderPage called with:', PageClass.name, 'hideNav:', hideNav, 'args:', args);
    try {
      // Teardown previous page
      if (this.currentPage && typeof this.currentPage.destroy === 'function') {
        this.currentPage.destroy();
      }

      // Clear app container
      const appContainer = document.getElementById('app');
      console.log('App container:', appContainer);
      
      if (!appContainer) {
        console.error('App container not found!');
        return;
      }
      
      appContainer.innerHTML = '';
      document.body.style.overflow = '';

      // Create main wrapper
      const wrapper = document.createElement('div');
      wrapper.id = 'main-wrapper';
      wrapper.className = 'min-h-screen';
      appContainer.appendChild(wrapper);

      // Render navigation (skip for auth page)
      if (!hideNav) {
        console.log('Rendering navigation');
        const navElement = this.navigation.render();
        wrapper.appendChild(navElement);
      } else {
        const orphanDrawer = document.getElementById('tablet-nav-drawer');
        if (orphanDrawer) {
          orphanDrawer.remove();
        }
      }

      // Create page container
      const pageContainer = document.createElement('div');
      pageContainer.id = 'page-container';
      wrapper.appendChild(pageContainer);

      // Render page
      console.log('Creating page instance with args:', args);
      this.currentPage = args.length > 0 ? new PageClass(...args) : new PageClass();
      const pageElement = this.currentPage.render();
      console.log('Page element created:', pageElement);
      
      if (!pageElement) {
        console.error('Page element is null or undefined!');
        return;
      }
      
      pageContainer.appendChild(pageElement);
      
      // Call afterRender for page
      if (this.currentPage.afterRender) {
        console.log('Calling afterRender');
        this.currentPage.afterRender();
      }

      // Lucide before navigation hooks so icon replacement cannot strip the menu button handler
      if (window.lucide) {
        console.log('Initializing Lucide icons');
        window.lucide.createIcons();
      }

      if (!hideNav && this.navigation.afterRender) {
        this.navigation.afterRender();
      }

      const routePath = router.getCurrentRoute();
      const seoCtx =
        this.currentPage && typeof this.currentPage.getSeoContext === 'function'
          ? this.currentPage.getSeoContext()
          : {};
      applyRouteSeo(routePath, seoCtx);

      // Update router state
      stateManager.setState({ currentRoute: routePath });
      console.log('Page render complete!');
      console.log('Wrapper children:', wrapper.children.length);
    } catch (error) {
      console.error('Error in renderPage:', error);
      console.error('Stack:', error.stack);
    }
  }

  handleStateChange(state) {
    // Handle modal state changes
    if (state.modalState.artworkLightbox && state.modalState.selectedArtwork) {
      // Lightbox is already handled by event listener
    }
  }

  openLightbox(artwork) {
    console.log('App: openLightbox called for:', artwork.title);
    const lightbox = new ArtworkLightbox();
    console.log('App: ArtworkLightbox created');
    lightbox.setArtwork(artwork);
    console.log('App: Artwork set');
    lightbox.mount();
    console.log('App: Lightbox mounted');
  }

  openContentViewer(content) {
    const viewer = new ContentViewer(content.type, content.data);
    viewer.mount();
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  console.log('Waiting for DOM...');
  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Ready! Creating App...');
    new App();
  });
} else {
  console.log('DOM already loaded, creating App...');
  new App();
}

// Make app available globally for debugging
window.App = App;
console.log('App.js loaded');

