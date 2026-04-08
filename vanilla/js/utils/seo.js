/**
 * SEO configuration from Artistry content strategy (Sheet2).
 * Set window.__ARTISTRY_SITE_ORIGIN__ before app load to override canonical / OG URLs.
 */
export const SITE_ORIGIN =
  (typeof window !== 'undefined' && window.__ARTISTRY_SITE_ORIGIN__) || 'https://artistry.app';

/** Absolute URL to 1200×630 (or similar) share image; set window.__ARTISTRY_OG_IMAGE__ when you host one */
function getOgImageUrl() {
  if (typeof window !== 'undefined' && window.__ARTISTRY_OG_IMAGE__) {
    return window.__ARTISTRY_OG_IMAGE__;
  }
  return '';
}

/** @typedef {{ title: string, description: string, robots?: string, ogType?: string }} SeoEntry */

/** Indexable public & marketing pages */
const PUBLIC_SEO = {
  '/': {
    title: 'Artistry | The Best Portfolio Platform for Visual Artists',
    description:
      'Escape the algorithm. Artistry is the ad-free portfolio platform built for artists to showcase concept art, 3D renders, and illustrations with deep context.',
    ogType: 'website'
  },
  '/feed': {
    title: 'Explore Digital Art & Artist Portfolios | Artistry',
    description:
      'Discover stunning digital art, 3D models, and concept art. Browse portfolios, get inspired, and connect with top freelance artists globally.',
    ogType: 'website'
  },
  '/feed/concept-art': {
    title: 'Concept Art Portfolios & Digital Inspiration | Artistry',
    description:
      'Explore thousands of concept art portfolios. Discover cyberpunk cities, fantasy environments, and character designs from top digital artists.',
    ogType: 'website'
  },
  '/feed/3d-modeling': {
    title: '3D Art & Character Modeling Portfolios | Artistry',
    description:
      'Browse incredible 3D art portfolios. Discover hard surface modeling, ZBrush sculpts, and stylized 3D environments from top freelance 3D artists.',
    ogType: 'website'
  },
  '/feed/procreate': {
    title: 'Procreate Digital Art Inspiration & Portfolios | Artistry',
    description:
      'Explore stunning digital illustrations created in Procreate. Discover iPad artists, custom brush techniques, and amazing digital painting portfolios.',
    ogType: 'website'
  },
  '/hire': {
    title: 'Hire Top Freelance Artists & Illustrators | Artistry',
    description:
      'Looking for the perfect artist? Browse curated portfolios and hire top freelance illustrators, concept artists, and 3D modelers for your next project.',
    ogType: 'website'
  },
  '/hire/concept-artists': {
    title: 'Hire Top Freelance Concept Artists | Artistry',
    description:
      'Looking to hire a 2D concept artist? Browse portfolios of top freelance concept artists for games, film, and publishing. Contact them directly today.',
    ogType: 'website'
  },
  '/hire/animators': {
    title: 'Hire Freelance Animators & 3D Artists | Artistry',
    description:
      'Find and hire freelance animators, riggers, and 3D motion graphics artists for your next project. Browse portfolios and message artists instantly.',
    ogType: 'website'
  },
  '/commissions': {
    title: 'Commission Custom Digital Art & Portraits | Artistry',
    description:
      'Want unique art? Commission custom digital art, portraits, and illustrations directly from talented freelance artists. Safe, secure, and ad-free.',
    ogType: 'website'
  },
  '/commissions/dnd': {
    title: 'D&D Character Art Commissions | Custom RPG Art | Artistry',
    description:
      'Commission custom D&D character art. Hire talented fantasy illustrators to bring your tabletop RPG characters and campaigns to life.',
    ogType: 'website'
  },
  '/commissions/vtuber': {
    title: 'Custom VTuber Model & Live2D Commissions | Artistry',
    description:
      'Commission custom VTuber models and professional Live2D rigging. Browse talented anime artists and riggers ready to build your virtual persona.',
    ogType: 'website'
  },
  '/pro': {
    title: 'Artistry Pro | Ad-Free Portfolios & Custom Domains',
    description:
      'Upgrade to Artistry Pro. Enjoy ad-free portfolios, 4K high-res uploads, custom domain integration, and advanced analytics for your art career.',
    ogType: 'website'
  },
  '/news': {
    title: 'Artistry Blog | Creator Resources & Art Industry News',
    description:
      'Learn how to price commissions, protect your art from AI, and build an incredible digital portfolio. Read the latest tips and news from the Artistry community.',
    ogType: 'website'
  },
  '/reviews/drawing-tablets': {
    title: 'Best Drawing Tablets for Digital Artists (2026) | Artistry',
    description:
      'Discover the best drawing tablets for beginners and pros. Compare Wacom, Huion, and iPad Pro to find the perfect digital art setup.',
    ogType: 'article'
  },
  '/auth': {
    title: 'Create Your Free Art Portfolio | Join Artistry',
    description:
      'Sign up for Artistry today. Create your free, ad-free digital art portfolio, connect with Art Directors, and start accepting freelance commissions globally.',
    ogType: 'website'
  },
  '/about': {
    title: 'About Artistry | The Narrative Portfolio Platform',
    description:
      "Learn about Artistry's mission to rescue visual art from algorithmic feeds. We are building a platform where artists are valued for their craft, not clicks.",
    ogType: 'website'
  },
  '/privacy': {
    title: 'Privacy Policy | Artistry',
    description:
      'Read the Artistry Privacy Policy to understand how we protect your data and intellectual property.',
    robots: 'noindex, follow',
    ogType: 'website'
  }
};

const PRIVATE_SEO = {
  '/profile': {
    title: 'Dashboard & Portfolio Builder | Artistry',
    description:
      'Customize your narrative art portfolio. Upload high-resolution 4K images, manage collections, and update your commission availability on Artistry.',
    robots: 'noindex, nofollow'
  },
  '/messages': {
    title: 'Manage Art Commissions & Freelance Inquiries | Artistry',
    description:
      'Manage your freelance art commissions, communicate with clients, and negotiate rates securely through the Artistry platform messaging system.',
    robots: 'noindex, nofollow'
  },
  '/settings': {
    title: 'Account Settings | Artistry',
    description:
      'Manage your Artistry Pro subscription, update your custom domain, and control your notification preferences.',
    robots: 'noindex, nofollow'
  },
  '/notifications': {
    title: 'Notifications | Artistry',
    description:
      'View your latest likes, commission requests, and profile interactions on Artistry.',
    robots: 'noindex, nofollow'
  }
};

function humanizeSlug(slug) {
  return decodeURIComponent(slug)
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function ensureMeta(attrName, attrValue, content) {
  let el = document.querySelector(`meta[${attrName}="${attrValue}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function ensureProperty(prop, content) {
  let el = document.querySelector(`meta[property="${prop}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', prop);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function ensureCanonical(href) {
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/**
 * @param {string} path
 * @param {{ profileName?: string, chatWith?: string }} [context]
 * @returns {SeoEntry & { canonical: string }}
 */
export function resolveSeoForPath(path, context = {}) {
  const normalized = path.split('?')[0].replace(/\/$/, '') || '/';

  if (normalized.startsWith('/messages/') && normalized !== '/messages') {
    const withName = context.chatWith
      ? `Chat with ${context.chatWith} | Artistry`
      : 'Chat | Artistry Messages';
    return {
      title: withName,
      description:
        'Securely communicate regarding art commissions and freelance work on Artistry.',
      robots: 'noindex, nofollow',
      ogType: 'website',
      canonical: `${SITE_ORIGIN}${normalized}`
    };
  }

  if (normalized === '/messages') {
    return {
      ...PRIVATE_SEO['/messages'],
      canonical: `${SITE_ORIGIN}/messages`,
      ogType: 'website'
    };
  }

  if (PUBLIC_SEO[normalized]) {
    return {
      ...PUBLIC_SEO[normalized],
      robots: PUBLIC_SEO[normalized].robots || 'index, follow',
      canonical: `${SITE_ORIGIN}${normalized}`,
      ogType: PUBLIC_SEO[normalized].ogType || 'website'
    };
  }

  if (PRIVATE_SEO[normalized]) {
    return {
      ...PRIVATE_SEO[normalized],
      canonical: `${SITE_ORIGIN}${normalized}`,
      ogType: 'website'
    };
  }

  const userMatch = normalized.match(/^\/user\/([^/]+)$/);
  if (userMatch) {
    const slug = userMatch[1];
    const display = context.profileName || humanizeSlug(slug);
    return {
      title: `${display} - Art Portfolio & Commissions | Artistry`,
      description: `View the official art portfolio of ${display}. Explore digital illustrations, concept art, and case studies. Available for freelance hiring and commissions.`,
      robots: 'index, follow',
      ogType: 'profile',
      canonical: `${SITE_ORIGIN}${normalized}`
    };
  }

  const artworkMatch = normalized.match(/^\/user\/([^/]+)\/([^/]+)$/);
  if (artworkMatch) {
    const artist = context.profileName || humanizeSlug(artworkMatch[1]);
    const piece = context.artworkTitle || 'Artwork';
    return {
      title: `${piece} | Digital Art by ${artist} | Artistry`,
      description: `Explore '${piece}' by ${artist} on Artistry. Dive into the creation process, view high-res details, and discover more narrative portfolios.`,
      robots: 'index, follow',
      ogType: 'article',
      canonical: `${SITE_ORIGIN}${normalized}`
    };
  }

  return {
    ...PUBLIC_SEO['/'],
    robots: 'index, follow',
    canonical: `${SITE_ORIGIN}/`,
    ogType: 'website'
  };
}

/**
 * Apply title, meta description, robots, canonical, Open Graph, and Twitter tags.
 * @param {string} path
 * @param {{ profileName?: string, chatWith?: string, artworkTitle?: string }} [context]
 */
export function applyRouteSeo(path, context = {}) {
  const seo = resolveSeoForPath(path, context);

  document.title = seo.title;
  ensureMeta('name', 'description', seo.description);
  ensureMeta('name', 'robots', seo.robots || 'index, follow');

  ensureCanonical(seo.canonical);

  ensureProperty('og:title', seo.title);
  ensureProperty('og:description', seo.description);
  ensureProperty('og:url', seo.canonical);
  ensureProperty('og:type', seo.ogType || 'website');
  ensureProperty('og:site_name', 'Artistry');
  ensureProperty('og:locale', 'en_US');

  const ogImage = getOgImageUrl();
  if (ogImage) {
    ensureProperty('og:image', ogImage);
    ensureMeta('name', 'twitter:card', 'summary_large_image');
    ensureMeta('name', 'twitter:image', ogImage);
  } else {
    ensureMeta('name', 'twitter:card', 'summary');
  }

  ensureMeta('name', 'twitter:title', seo.title);
  ensureMeta('name', 'twitter:description', seo.description);
}
