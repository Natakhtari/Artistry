import { Component } from './Component.js';
import { api } from '../utils/api.js';

export class NewsPage extends Component {
  constructor() {
    super('news-page');
    this.articles  = [];
    this.loading   = true;
    this.activeTab = 'all';
    this.categories = [];
  }

  render() {
    const container = this.createElement('div', {
      className: 'min-h-screen pb-16 md:pb-8 pt-[max(1rem,env(safe-area-inset-top))] md:pt-20'
    });

    const contentContainer = this.createElement('div', {
      className: 'max-w-6xl mx-auto px-3 md:px-6'
    });

    // Header
    const header = this.createElement('div', { className: 'mb-6' });
    header.appendChild(this.createElement('h1', {
      className: 'text-2xl md:text-3xl font-bold leading-tight'
    }, 'Artistry News & Creator Resources'));
    header.appendChild(this.createElement('p', {
      className: 'text-slate-400 text-xs md:text-sm mt-0.5 leading-snug'
    }, 'Curated from our database plus art-world RSS (Hyperallergic, Colossal). Optional NewsAPI headlines when NEWS_API_KEY is set on the server.'));

    // Category filter bar
    const filterBar = this.createElement('div', {
      id:        'news-filter-bar',
      className: 'flex gap-2 flex-wrap mb-6'
    });
    this._buildFilterPill(filterBar, 'all', 'All');

    // Articles grid
    const grid = this.createElement('div', {
      id:        'news-grid',
      className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
    });

    const loadingEl = this.createElement('div', {
      id:        'news-loading',
      className: 'col-span-3 text-center py-16 text-slate-400'
    }, 'Loading news…');
    grid.appendChild(loadingEl);

    contentContainer.appendChild(header);
    contentContainer.appendChild(filterBar);
    contentContainer.appendChild(grid);
    container.appendChild(contentContainer);

    return container;
  }

  afterRender() {
    super.afterRender();
    this._loadNews();
  }

  async _loadNews() {
    try {
      const [newsRes, catsRes] = await Promise.all([
        api.news.list({ limit: 30 }),
        api.news.categories(),
      ]);

      this.articles   = newsRes?.data?.items  ?? [];
      this.categories = catsRes?.data?.items  ?? [];

      this._populateFilters();
      this._renderGrid();
    } catch {
      const loading = document.getElementById('news-loading');
      if (loading) loading.textContent = 'Could not load news. Please try again later.';
    }
  }

  _populateFilters() {
    const bar = document.getElementById('news-filter-bar');
    if (!bar) return;
    this.categories.forEach(cat => this._buildFilterPill(bar, cat, cat));
  }

  _buildFilterPill(bar, value, label) {
    const btn = this.createElement('button', {
      'data-cat': value,
      className: this._pillClass(value),
    }, label);
    btn.addEventListener('click', () => this._setFilter(value));
    bar.appendChild(btn);
  }

  _pillClass(value) {
    const active = value === this.activeTab;
    return `px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
      active
        ? 'bg-primary text-white'
        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
    }`;
  }

  _setFilter(value) {
    this.activeTab = value;
    document.querySelectorAll('[data-cat]').forEach(btn => {
      btn.className = this._pillClass(btn.dataset.cat);
    });
    this._renderGrid();
  }

  _renderGrid() {
    const grid = document.getElementById('news-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const filtered = this.activeTab === 'all'
      ? this.articles
      : this.articles.filter(a => a.category === this.activeTab);

    if (filtered.length === 0) {
      grid.appendChild(this.createElement('p', {
        className: 'col-span-3 text-center py-16 text-slate-400'
      }, 'No articles found.'));
      return;
    }

    filtered.forEach(article => grid.appendChild(this._createCard(article)));
  }

  _createCard(article) {
    const card = this.createElement('div', { className: 'group cursor-pointer' });

    const inner = this.createElement('div', {
      className: 'bg-slate-800 rounded-2xl overflow-hidden hover:scale-[1.02] transition-all duration-300 h-full flex flex-col'
    });

    // Image
    const imgWrap = this.createElement('div', {
      className: 'relative h-48 overflow-hidden bg-slate-700'
    });

    if (article.image_url) {
      const img = this.createElement('img', {
        src:         article.image_url,
        alt:         `${article.title} — ${article.category ?? ''} article`,
        className:   'w-full h-full object-cover group-hover:scale-110 transition-transform duration-300',
        loading:     'lazy',
        referrerPolicy: 'no-referrer',
      });
      img.addEventListener('error', () => {
        img.remove();
        imgWrap.appendChild(this.createElement('div', {
          className: 'w-full h-full flex items-center justify-center text-slate-500 text-sm px-4 text-center'
        }, article.source_name || 'Article'));
      });
      imgWrap.appendChild(img);
    } else {
      imgWrap.appendChild(this.createElement('div', {
        className: 'w-full h-full flex items-center justify-center text-slate-500 text-sm px-4 text-center'
      }, article.source_name ? `${article.source_name}` : 'Art news'));
    }

    if (article.category) {
      const badge = this.createElement('span', {
        className: 'absolute top-4 left-4 px-3 py-1 bg-primary text-xs font-bold rounded-full'
      }, article.category);
      imgWrap.appendChild(badge);
    }

    // Content
    const content = this.createElement('div', { className: 'p-6 flex-1 flex flex-col' });
    content.appendChild(this.createElement('h3', {
      className: 'text-xl font-bold mb-2 group-hover:text-primary transition-colors'
    }, article.title));
    content.appendChild(this.createElement('p', {
      className: 'text-slate-400 text-sm mb-4 flex-1 line-clamp-3'
    }, article.description || ''));

    const footer = this.createElement('div', {
      className: 'flex items-center justify-between text-xs text-slate-500'
    });
    const dateStr = article.published_at
      ? new Date(article.published_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
      : '';
    footer.appendChild(this.createElement('span', {}, dateStr));
    if (article.source_name) {
      footer.appendChild(this.createElement('span', {}, article.source_name));
    }
    content.appendChild(footer);

    inner.appendChild(imgWrap);
    inner.appendChild(content);
    card.appendChild(inner);

    // Open article URL in new tab if available
    if (article.url) {
      card.addEventListener('click', () => window.open(article.url, '_blank', 'noopener'));
    }

    return card;
  }
}
