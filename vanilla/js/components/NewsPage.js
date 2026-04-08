import { Component } from './Component.js';

export class NewsPage extends Component {
  render() {
    const container = this.createElement('div', {
      className:
        'min-h-screen pb-16 md:pb-8 pt-[max(1rem,env(safe-area-inset-top))] md:pt-20'
    });

    const contentContainer = this.createElement('div', {
      className: 'max-w-6xl mx-auto px-3 md:px-6'
    });

    // Header
    const header = this.createElement('div', {
      className: 'mb-2 md:mb-4'
    });

    const title = this.createElement('h1', {
      className: 'text-2xl md:text-3xl font-bold leading-tight'
    }, 'Artistry News & Creator Resources');

    const subtitle = this.createElement('p', {
      className: 'text-slate-400 text-xs md:text-sm mt-0.5 md:mt-1 leading-snug'
    }, 'Portfolio tips, pricing commissions, and art industry news.');

    header.appendChild(title);
    header.appendChild(subtitle);

    // News Grid
    const grid = this.createElement('div', {
      className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
    });

    const articles = [
      {
        id: 1,
        image: 'https://cdn.pixabay.com/photo/2016/11/29/03/53/architecture-1867187_960_720.jpg',
        category: 'EXHIBITION',
        title: 'Modern Art Gallery Opens Downtown',
        excerpt: 'A new contemporary art space showcases emerging artists...',
        date: 'Dec 8, 2024',
        readTime: '5 min read'
      },
      {
        id: 2,
        image: 'https://cdn.pixabay.com/photo/2018/03/10/12/00/teamwork-3213924_960_720.jpg',
        category: 'INTERVIEW',
        title: 'Artist Spotlight: Digital Renaissance',
        excerpt: 'We sit down with leading digital artists to discuss...',
        date: 'Dec 7, 2024',
        readTime: '8 min read'
      },
      {
        id: 3,
        image: 'https://cdn.pixabay.com/photo/2017/08/01/08/29/woman-2563491_960_720.jpg',
        category: 'TRENDS',
        title: '2024 Art Market Trends',
        excerpt: 'Analysis of the biggest trends shaping the art world...',
        date: 'Dec 6, 2024',
        readTime: '6 min read'
      },
      {
        id: 4,
        image: 'https://cdn.pixabay.com/photo/2016/11/18/17/46/house-1836070_960_720.jpg',
        category: 'TECHNIQUE',
        title: 'Mastering Color Theory',
        excerpt: 'Essential tips for working with color in your art...',
        date: 'Dec 5, 2024',
        readTime: '10 min read'
      },
      {
        id: 5,
        image: 'https://cdn.pixabay.com/photo/2016/11/29/09/32/concept-1868728_960_720.jpg',
        category: 'NEWS',
        title: 'International Art Fair Announced',
        excerpt: 'Major art fair coming to the city next month...',
        date: 'Dec 4, 2024',
        readTime: '4 min read'
      },
      {
        id: 6,
        image: 'https://cdn.pixabay.com/photo/2015/01/08/18/29/entrepreneur-593358_960_720.jpg',
        category: 'GUIDE',
        title: 'Starting Your Art Collection',
        excerpt: 'A beginner\'s guide to collecting contemporary art...',
        date: 'Dec 3, 2024',
        readTime: '7 min read'
      }
    ];

    articles.forEach(article => {
      const card = this.createArticleCard(article);
      grid.appendChild(card);
    });

    contentContainer.appendChild(header);
    contentContainer.appendChild(grid);
    container.appendChild(contentContainer);

    return container;
  }

  createArticleCard(article) {
    const card = this.createElement('div', {
      className: 'group cursor-pointer'
    });

    const cardInner = this.createElement('div', {
      className: 'bg-slate-800 rounded-2xl overflow-hidden hover:transform hover:scale-[1.02] transition-all duration-300 h-full flex flex-col'
    });

    // Image Container
    const imageContainer = this.createElement('div', {
      className: 'relative h-48 overflow-hidden bg-slate-700'
    });

    const image = this.createElement('img', {
      src: article.image,
      alt: `${article.title} — ${article.category} article, Artistry news`,
      className: 'w-full h-full object-cover group-hover:scale-110 transition-transform duration-300'
    });

    const category = this.createElement('span', {
      className: 'absolute top-4 left-4 px-3 py-1 bg-primary text-xs font-bold rounded-full'
    }, article.category);

    imageContainer.appendChild(image);
    imageContainer.appendChild(category);

    // Content
    const content = this.createElement('div', {
      className: 'p-6 flex-1 flex flex-col'
    });

    const title = this.createElement('h3', {
      className: 'text-xl font-bold mb-2 group-hover:text-primary transition-colors'
    }, article.title);

    const excerpt = this.createElement('p', {
      className: 'text-slate-400 text-sm mb-4 flex-1'
    }, article.excerpt);

    const footer = this.createElement('div', {
      className: 'flex items-center justify-between text-xs text-slate-500'
    });

    const date = this.createElement('span', {}, article.date);
    const readTime = this.createElement('span', {}, article.readTime);

    footer.appendChild(date);
    footer.appendChild(readTime);

    content.appendChild(title);
    content.appendChild(excerpt);
    content.appendChild(footer);

    cardInner.appendChild(imageContainer);
    cardInner.appendChild(content);
    card.appendChild(cardInner);

    return card;
  }
}

