import { Component } from './Component.js';
import { router } from '../router.js';
import { api } from '../utils/api.js';
import { toast } from '../utils/toast.js';
import { stateManager } from '../utils/state.js';

function formatRelative(iso) {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 45) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

function actionPhrase(n) {
  const { type, object_type: ot } = n;
  if (type === 'like' && ot === 'artwork') return 'liked your artwork';
  if (type === 'like' && ot === 'blog_post') return 'liked your article';
  if (type === 'new_message') return 'sent you a message';
  if (type === 'message_liked') return 'liked your message';
  if (type === 'comment' && ot === 'artwork') return 'commented on your artwork';
  if (type === 'comment' && ot === 'blog_post') return 'commented on your article';
  if (type === 'follow') return 'started following you';
  return 'interacted with you';
}

function mapArtworkShowToLightbox(d) {
  const media = d.media || [];
  const imgM = media.find((m) => m.type === 'image');
  const vidM = media.find((m) => m.type === 'video');
  const audM = media.find((m) => m.type === 'audio');
  const type = d.content_type || 'photo';
  const artist = (d.artist_username || 'Artist').trim();
  const thumb = imgM?.url || media[0]?.url || null;
  return {
    id:          d.id,
    type,
    title:       d.title || 'Untitled',
    description: d.description || '',
    artist,
    username:    d.artist_username || '',
    avatar:      d.artist_avatar || null,
    image:       thumb,
    thumbnail:   thumb,
    media_src:   vidM?.url || audM?.url || null,
    likes:       Number(d.like_count) || 0,
    comments:    0,
  };
}

export class NotificationsPage extends Component {
  constructor() {
    super('app');
    this.notifications = [];
    this.loading = true;
    this.loadError = null;
  }

  render() {
    const container = this.createElement('div', {
      className:
        'min-h-screen pb-16 md:pb-8 pt-[max(1rem,env(safe-area-inset-top))] md:pt-20'
    });

    const contentContainer = this.createElement('div', {
      className: 'max-w-3xl mx-auto px-3 md:px-6'
    });

    const header = this.createElement('div', {
      className: 'flex items-center justify-between mb-2 md:mb-4'
    });

    header.appendChild(
      this.createElement('h1', { className: 'text-2xl md:text-3xl font-bold leading-tight' }, 'Notifications')
    );

    const clearAllBtn = this.createElement('button', {
      className: 'text-sm text-primary hover:text-primary transition-colors disabled:opacity-40',
      disabled: this.loading || this.notifications.length === 0
    }, 'Clear All');
    clearAllBtn.addEventListener('click', () => this.clearAll());

    header.appendChild(clearAllBtn);

    const notificationsList = this.createElement('div', {
      className: 'space-y-4',
      id: 'notifications-list'
    });

    if (this.loading) {
      notificationsList.appendChild(
        this.createElement('p', { className: 'text-slate-400 text-sm py-8 text-center' }, 'Loading…')
      );
    } else if (this.loadError) {
      const err = this.createElement('div', { className: 'text-center py-12' });
      err.appendChild(this.createElement('p', { className: 'text-slate-400 mb-4' }, this.loadError));
      const retry = this.createElement('button', {
        className: 'px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm'
      }, 'Retry');
      retry.addEventListener('click', () => this.reload());
      err.appendChild(retry);
      notificationsList.appendChild(err);
    } else if (this.notifications.length === 0) {
      notificationsList.appendChild(this.createEmptyState());
    } else {
      this.notifications.forEach((notif) => {
        notificationsList.appendChild(this.createNotificationCard(notif));
      });
    }

    contentContainer.appendChild(header);
    contentContainer.appendChild(notificationsList);
    container.appendChild(contentContainer);

    return container;
  }

  createNotificationCard(notif) {
    const unread = !notif.read_at;
    const notifCard = this.createElement('div', {
      className: `bg-slate-800 p-4 rounded-xl hover:bg-slate-700 transition-colors relative group cursor-pointer border-l-4 ${
        unread ? 'border-primary' : 'border-transparent'
      }`
    });
    notifCard.addEventListener('click', () => this._onOpen(notif));

    const flexContainer = this.createElement('div', {
      className: 'flex items-center gap-4'
    });

    const avatarUrl = notif.actor_avatar || '';
    const avatarContainer = this.createElement('div', {
      className: 'w-12 h-12 rounded-full overflow-hidden bg-slate-700 flex-shrink-0 flex items-center justify-center text-sm font-bold text-slate-300'
    });

    if (avatarUrl) {
      const avatar = this.createElement('img', {
        src: avatarUrl,
        alt: '',
        className: 'w-full h-full object-cover'
      });
      avatar.addEventListener('error', () => {
        avatar.remove();
        avatarContainer.textContent = (notif.actor_username || '?').charAt(0).toUpperCase();
      });
      avatarContainer.appendChild(avatar);
    } else {
      avatarContainer.textContent = (notif.actor_username || '?').charAt(0).toUpperCase();
    }

    const content = this.createElement('div', {
      className: 'flex-1 min-w-0'
    });

    const text = this.createElement('p', { className: 'text-sm' });
    text.appendChild(
      this.createElement('span', { className: 'font-medium' }, `${notif.actor_username || 'Someone'} `)
    );
    text.appendChild(this.createElement('span', { className: 'text-slate-400' }, actionPhrase(notif)));

    if (notif.body_preview && (notif.type === 'new_message' || notif.type === 'comment')) {
      const prev = this.createElement('p', {
        className: 'text-xs text-slate-500 mt-1 truncate'
      }, `"${notif.body_preview}"`);
      content.appendChild(text);
      content.appendChild(prev);
    } else {
      content.appendChild(text);
    }

    content.appendChild(
      this.createElement('p', { className: 'text-xs text-slate-500 mt-1' }, formatRelative(notif.created_at))
    );

    const deleteBtn = this.createElement('button', {
      type: 'button',
      className:
        'absolute top-4 right-4 p-2 bg-slate-900 hover:bg-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-10'
    });
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.deleteNotification(notif.id);
    });
    deleteBtn.appendChild(this.createIcon('x', 'w-4 h-4'));

    flexContainer.appendChild(avatarContainer);
    flexContainer.appendChild(content);
    notifCard.appendChild(flexContainer);
    notifCard.appendChild(deleteBtn);

    return notifCard;
  }

  async _onOpen(n) {
    const { type, object_type: ot, object_id: oid, actor_id: aid, actor_username: au } = n;

    if (type === 'new_message' || type === 'message_liked') {
      if (aid) router.navigate(`/messages/${aid}`);
      return;
    }
    if (type === 'follow') {
      if (au) router.navigate(`/user/${encodeURIComponent(au)}`);
      return;
    }
    if ((type === 'like' || type === 'comment') && ot === 'artwork' && oid) {
      try {
        const res = await api.artworks.show(oid);
        const detail = mapArtworkShowToLightbox(res.data);
        stateManager.updateNested('modalState.selectedArtwork', detail);
        stateManager.updateNested('modalState.artworkLightbox', true);
        window.dispatchEvent(new CustomEvent('openLightbox', { detail }));
      } catch {
        toast.show('Could not open artwork', 'error');
        router.navigate('/feed');
      }
      return;
    }
    if (ot === 'blog_post') {
      router.navigate('/news');
      return;
    }
    router.navigate('/feed');
  }

  async deleteNotification(id) {
    try {
      await api.notifications.remove(id);
      this.notifications = this.notifications.filter((x) => Number(x.id) !== Number(id));
      this.rerender();
      window.dispatchEvent(new Event('artistry-notifications-updated'));
    } catch (e) {
      toast.show(e.message || 'Could not remove', 'error');
    }
  }

  async clearAll() {
    if (!this.notifications.length) return;
    if (!confirm('Clear all notifications?')) return;
    try {
      await api.notifications.clear();
      this.notifications = [];
      this.rerender();
      window.dispatchEvent(new Event('artistry-notifications-updated'));
    } catch (e) {
      toast.show(e.message || 'Could not clear', 'error');
    }
  }

  createEmptyState() {
    const emptyState = this.createElement('div', {
      className: 'text-center py-16'
    });
    emptyState.appendChild(this.createIcon('bell-off', 'w-20 h-20 mx-auto mb-4 text-slate-600'));
    emptyState.appendChild(
      this.createElement('h3', { className: 'text-2xl font-bold mb-2' }, 'No notifications')
    );
    emptyState.appendChild(
      this.createElement('p', { className: 'text-slate-400' }, "You're all caught up!")
    );
    return emptyState;
  }

  async reload() {
    await this._fetch();
  }

  async _fetch() {
    this.loading = true;
    this.loadError = null;
    this.rerender();
    try {
      const res = await api.notifications.list({ limit: 50, offset: 0 });
      this.notifications = res?.data?.items ?? [];
      try {
        await api.notifications.markRead();
        window.dispatchEvent(new Event('artistry-notifications-updated'));
      } catch {
        /* non-fatal */
      }
    } catch (e) {
      this.loadError = e.message || 'Could not load notifications';
      this.notifications = [];
    } finally {
      this.loading = false;
    }
    this.rerender();
  }

  afterRender() {
    super.afterRender();
    this._fetch();
  }

  rerender() {
    const pageContainer = document.getElementById('page-container');
    if (!pageContainer) return;
    pageContainer.innerHTML = '';
    pageContainer.appendChild(this.render());
    if (window.lucide) window.lucide.createIcons();
  }
}
