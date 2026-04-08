import { Component } from './Component.js';
import { router } from '../router.js';
import { stateManager } from '../utils/state.js';
import { CreatePostModal } from './CreatePostModal.js';

/** Viewport width at or above this uses top tabs (desktop). Below tablet max = hamburger. */
const DESKTOP_MIN_WIDTH = 1280;

export class Navigation extends Component {
  constructor() {
    super('app');
    this.tabletMenuOpen = false;
    this._onResize = () => this.syncResponsiveNav();
    window.addEventListener('resize', this._onResize);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', this._onResize);
    }
  }

  getViewportMode() {
    const width = window.innerWidth || document.documentElement.clientWidth || 0;
    if (width < 768) return 'mobile';
    if (width < DESKTOP_MIN_WIDTH) return 'tablet';
    return 'desktop';
  }

  getCurrentRoute() {
    return router.getCurrentRoute();
  }

  isLinkActive(path) {
    const current = this.getCurrentRoute();
    if (path === '/messages') {
      return current === '/messages' || current.startsWith('/messages/');
    }
    return current === path;
  }

  syncResponsiveNav() {
    const mode = this.getViewportMode();
    const isMobile = mode === 'mobile';
    const isTablet = mode === 'tablet';
    const isDesktop = mode === 'desktop';

    const nav = document.querySelector('.artistry-nav');
    if (nav) {
      nav.style.position = 'fixed';
      nav.style.left = '0';
      nav.style.right = '0';
      nav.style.zIndex = '9999';
      if (isMobile) {
        nav.style.bottom = '0';
        nav.style.top = 'auto';
      } else {
        nav.style.top = '0';
        nav.style.bottom = 'auto';
      }
    }

    const desktopLinks = document.querySelector('.artistry-nav-desktop-links');
    if (desktopLinks) {
      desktopLinks.style.display = isDesktop ? 'flex' : 'none';
      if (isDesktop) {
        desktopLinks.style.alignItems = 'center';
        desktopLinks.style.justifyContent = 'flex-end';
        desktopLinks.style.gap = '0.25rem';
        desktopLinks.style.flex = '1 1 0%';
        desktopLinks.style.minWidth = '0';
        desktopLinks.style.marginLeft = '1rem';
        desktopLinks.style.flexWrap = 'wrap';
      }
    }

    const mobileLinks = document.querySelector('.artistry-nav-mobile-links');
    if (mobileLinks) {
      mobileLinks.style.display = isMobile ? 'flex' : 'none';
      if (isMobile) {
        mobileLinks.style.alignItems = 'center';
        mobileLinks.style.justifyContent = 'space-around';
        mobileLinks.style.width = '100%';
      }
    }

    const logo = document.querySelector('[data-artistry-nav-logo]');
    if (logo) {
      logo.style.display = isMobile ? 'none' : 'flex';
      if (!isMobile) {
        logo.style.alignItems = 'center';
        logo.style.gap = '0.5rem';
      }
    }

    const menuBtn = document.getElementById('tablet-nav-menu-btn');
    if (menuBtn) {
      menuBtn.style.display = isTablet ? 'flex' : 'none';
      if (isTablet) {
        menuBtn.style.alignItems = 'center';
        menuBtn.style.justifyContent = 'center';
        menuBtn.style.minWidth = '44px';
        menuBtn.style.minHeight = '44px';
      }
    }

    const drawer = document.getElementById('tablet-nav-drawer');
    if (drawer) {
      drawer.style.position = 'fixed';
      drawer.style.left = '0';
      drawer.style.top = '0';
      drawer.style.right = '0';
      drawer.style.bottom = '0';
      drawer.style.zIndex = '10000';

      if (!isTablet) {
        this.tabletMenuOpen = false;
        drawer.style.display = 'none';
        drawer.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      } else {
        drawer.style.display = this.tabletMenuOpen ? 'block' : 'none';
        drawer.setAttribute('aria-hidden', this.tabletMenuOpen ? 'false' : 'true');
      }
    }
  }

  closeTabletMenu() {
    this.tabletMenuOpen = false;
    const drawer = document.getElementById('tablet-nav-drawer');
    if (drawer) {
      drawer.style.display = 'none';
      drawer.setAttribute('aria-hidden', 'true');
    }
    const menuBtn = document.getElementById('tablet-nav-menu-btn');
    if (menuBtn) {
      menuBtn.setAttribute('aria-expanded', 'false');
    }
    document.body.style.overflow = '';
  }

  openTabletMenu() {
    if (this.getViewportMode() !== 'tablet') return;
    this.tabletMenuOpen = true;
    const drawer = document.getElementById('tablet-nav-drawer');
    if (drawer) {
      drawer.style.display = 'block';
      drawer.setAttribute('aria-hidden', 'false');
    }
    const menuBtn = document.getElementById('tablet-nav-menu-btn');
    if (menuBtn) {
      menuBtn.setAttribute('aria-expanded', 'true');
    }
    document.body.style.overflow = 'hidden';
  }

  toggleTabletMenu() {
    if (this.tabletMenuOpen) {
      this.closeTabletMenu();
      return;
    }
    this.openTabletMenu();
  }

  render() {
    const state = stateManager.getState();
    const nav = this.createElement('nav', {
      className:
        'artistry-nav fixed bottom-0 left-0 right-0 md:top-0 md:bottom-auto bg-slate-900/95 backdrop-blur-sm border-t md:border-t-0 md:border-b border-slate-800'
    });

    const container = this.createElement('div', {
      className: 'max-w-7xl mx-auto px-2 md:px-4'
    });
    const flexContainer = this.createElement('div', {
      className: 'flex items-center justify-between h-16 md:h-20 w-full gap-2'
    });

    const logoLink = this.createElement('a', {
      href: '/',
      className: 'text-xl font-bold gradient-text',
      'data-artistry-nav-logo': 'true'
    });
    logoLink.addEventListener('click', (e) => {
      e.preventDefault();
      this.closeTabletMenu();
      router.navigate('/');
    });
    logoLink.appendChild(this.createIcon('palette', 'w-8 h-8'));
    logoLink.appendChild(document.createTextNode('Artistry'));

    const navLinksDesktop = this.createElement('div', {
      className: 'artistry-nav-desktop-links flex-wrap justify-end'
    });
    const navLinksMobile = this.createElement('div', {
      className: 'artistry-nav-mobile-links'
    });

    const menuBtn = this.createElement('button', {
      type: 'button',
      id: 'tablet-nav-menu-btn',
      className:
        'items-center justify-center p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex-shrink-0',
      'aria-label': 'Open menu',
      'aria-expanded': 'false',
      'aria-controls': 'tablet-nav-drawer'
    });
    const menuGlyph = this.createElement(
      'span',
      { className: 'select-none font-bold', style: { fontSize: '1.5rem', lineHeight: '1' } },
      '\u2630'
    );
    menuBtn.appendChild(menuGlyph);

    const links = [
      { path: '/', icon: 'home', label: 'Home', showOnMobile: true },
      { path: '/feed', icon: 'layout-grid', label: 'Feed', showOnMobile: true },
      { path: '/news', icon: 'newspaper', label: 'News', showOnMobile: false },
      { path: '/messages', icon: 'message-circle', label: 'Messages', showOnMobile: true },
      { path: '/notifications', icon: 'bell', label: 'Notifications', showOnMobile: true },
      { path: '/profile', icon: 'user', label: 'Profile', showOnMobile: true },
      { path: 'create', icon: 'plus', label: 'Add Post', showOnMobile: false, isButton: true }
    ];

    links.forEach((link) => {
      if (link.isButton && state.isAuthenticated) {
        const desktopCreate = this.createElement('button', {
          className:
            'flex flex-row items-center justify-center gap-2 py-2 px-4 rounded-lg transition-all text-white',
          style: 'background-color: #F25C54'
        });
        desktopCreate.appendChild(this.createIcon(link.icon, 'w-5 h-5 flex-shrink-0'));
        desktopCreate.appendChild(
          this.createElement('span', { className: 'text-sm font-medium' }, link.label)
        );
        desktopCreate.addEventListener('mouseenter', (e) => {
          e.currentTarget.style.backgroundColor = '#D93830';
        });
        desktopCreate.addEventListener('mouseleave', (e) => {
          e.currentTarget.style.backgroundColor = '#F25C54';
        });
        desktopCreate.addEventListener('click', () => {
          this.closeTabletMenu();
          this.openCreateModal();
        });
        navLinksDesktop.appendChild(desktopCreate);
        return;
      }

      const isActive = this.isLinkActive(link.path);
      const desktopLink = this.createElement('a', {
        href: link.path,
        className: `flex flex-row items-center justify-center gap-2 py-2 px-4 rounded-lg transition-all ${
          isActive ? 'text-primary bg-primary/10' : 'text-slate-400 hover:text-white hover:bg-slate-800'
        }`,
        style: isActive ? 'color: #F25C54' : ''
      });
      desktopLink.appendChild(this.createIcon(link.icon, 'w-5 h-5 flex-shrink-0'));
      desktopLink.appendChild(
        this.createElement('span', { className: 'text-sm font-medium leading-none' }, link.label)
      );
      desktopLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.closeTabletMenu();
        router.navigate(link.path);
      });
      navLinksDesktop.appendChild(desktopLink);

      if (link.showOnMobile) {
        const mobileLink = this.createElement('a', {
          href: link.path,
          className: `flex flex-col items-center justify-center gap-0.5 py-2 rounded-lg transition-all w-16 ${
            isActive ? 'text-primary bg-primary/10' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`,
          style: isActive ? 'color: #F25C54' : ''
        });
        mobileLink.appendChild(this.createIcon(link.icon, 'w-5 h-5 flex-shrink-0'));
        mobileLink.appendChild(
          this.createElement('span', { className: 'text-[10px] font-medium leading-none' }, link.label)
        );
        mobileLink.addEventListener('click', (e) => {
          e.preventDefault();
          router.navigate(link.path);
        });
        navLinksMobile.appendChild(mobileLink);
      }
    });

    flexContainer.appendChild(logoLink);
    flexContainer.appendChild(navLinksDesktop);
    flexContainer.appendChild(menuBtn);
    flexContainer.appendChild(navLinksMobile);
    container.appendChild(flexContainer);
    nav.appendChild(container);

    const oldDrawer = document.getElementById('tablet-nav-drawer');
    if (oldDrawer) oldDrawer.remove();
    document.body.appendChild(this.buildTabletDrawer(links, state));

    return nav;
  }

  buildTabletDrawer(links, state) {
    const drawerRoot = this.createElement('div', {
      id: 'tablet-nav-drawer',
      style: {
        position: 'fixed',
        left: '0',
        top: '0',
        right: '0',
        bottom: '0',
        zIndex: '10000',
        display: this.tabletMenuOpen ? 'block' : 'none'
      },
      'aria-hidden': this.tabletMenuOpen ? 'false' : 'true',
      'aria-modal': 'true',
      role: 'dialog'
    });

    const backdrop = this.createElement('div', {
      className: 'absolute inset-0 bg-black/60 animate-fade-in'
    });
    backdrop.addEventListener('click', () => this.closeTabletMenu());

    const panel = this.createElement('aside', {
      className:
        'absolute right-0 top-0 h-full w-[min(20rem,88vw)] max-w-sm bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col overflow-y-auto'
    });

    const panelHeader = this.createElement('div', {
      className: 'flex items-center justify-between p-4 border-b border-slate-800 flex-shrink-0'
    });
    panelHeader.appendChild(
      this.createElement('span', { className: 'text-lg font-semibold gradient-text' }, 'Menu')
    );
    const closeBtn = this.createElement('button', {
      type: 'button',
      className:
        'p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors',
      'aria-label': 'Close menu'
    });
    closeBtn.appendChild(this.createIcon('x', 'w-6 h-6'));
    closeBtn.addEventListener('click', () => this.closeTabletMenu());
    panelHeader.appendChild(closeBtn);

    const panelBody = this.createElement('div', {
      className: 'flex flex-col p-2 gap-1 flex-1'
    });

    links.forEach((link) => {
      if (link.isButton && state.isAuthenticated) {
        const createBtn = this.createElement('button', {
          type: 'button',
          className:
            'flex items-center gap-3 w-full px-4 py-3 rounded-lg text-left text-white transition-colors',
          style: 'background-color: #F25C54'
        });
        createBtn.appendChild(this.createIcon(link.icon, 'w-5 h-5 flex-shrink-0'));
        createBtn.appendChild(this.createElement('span', { className: 'font-medium' }, link.label));
        createBtn.addEventListener('click', () => {
          this.closeTabletMenu();
          this.openCreateModal();
        });
        panelBody.appendChild(createBtn);
        return;
      }

      const isActive = this.isLinkActive(link.path);
      const row = this.createElement('a', {
        href: link.path,
        className: `flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-colors ${
          isActive ? 'text-primary bg-primary/10' : 'text-slate-300 hover:bg-slate-800'
        }`,
        style: isActive ? 'color: #F25C54' : ''
      });
      row.appendChild(this.createIcon(link.icon, 'w-5 h-5 flex-shrink-0'));
      row.appendChild(this.createElement('span', { className: 'font-medium' }, link.label));
      row.addEventListener('click', (e) => {
        e.preventDefault();
        this.closeTabletMenu();
        router.navigate(link.path);
      });
      panelBody.appendChild(row);
    });

    panel.appendChild(panelHeader);
    panel.appendChild(panelBody);
    drawerRoot.appendChild(backdrop);
    drawerRoot.appendChild(panel);
    return drawerRoot;
  }

  afterRender() {
    this.syncResponsiveNav();
    const menuBtn = document.getElementById('tablet-nav-menu-btn');
    if (menuBtn) {
      menuBtn.onclick = (e) => {
        e.preventDefault();
        this.toggleTabletMenu();
      };
    }
    if (this._escapeHandler) {
      document.removeEventListener('keydown', this._escapeHandler);
    }
    this._escapeHandler = (e) => {
      if (e.key === 'Escape' && this.tabletMenuOpen) {
        this.closeTabletMenu();
      }
    };
    document.addEventListener('keydown', this._escapeHandler);
  }

  openCreateModal() {
    const modal = new CreatePostModal(
      () => {},
      (newPost) => {
        window.dispatchEvent(new CustomEvent('newPostCreated', { detail: newPost }));
      }
    );
    modal.mount();
  }
}
