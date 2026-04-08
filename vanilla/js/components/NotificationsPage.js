import { Component } from './Component.js';

export class NotificationsPage extends Component {
  constructor() {
    super('app');
    this.notifications = [
      {
        id: 1,
        user: 'Marcus Chen',
        avatar: 'https://i.pravatar.cc/150?img=12',
        action: 'liked your artwork',
        time: '2 hours ago',
        type: 'like'
      },
      {
        id: 2,
        user: 'Sophia Laurent',
        avatar: 'https://i.pravatar.cc/150?img=5',
        action: 'started following you',
        time: '5 hours ago',
        type: 'follow'
      },
      {
        id: 3,
        user: 'Alex Kim',
        avatar: 'https://i.pravatar.cc/150?img=13',
        action: 'commented on your post',
        time: '1 day ago',
        type: 'comment'
      }
    ];
  }

  render() {
    const container = this.createElement('div', {
      className:
        'min-h-screen pb-16 md:pb-8 pt-[max(1rem,env(safe-area-inset-top))] md:pt-20'
    });

    const contentContainer = this.createElement('div', {
      className: 'max-w-3xl mx-auto px-3 md:px-6'
    });

    // Header
    const header = this.createElement('div', {
      className: 'flex items-center justify-between mb-2 md:mb-4'
    });

    const title = this.createElement('h1', {
      className: 'text-2xl md:text-3xl font-bold leading-tight'
    }, 'Notifications');

    const clearAllBtn = this.createElement('button', {
      className: 'text-sm text-primary hover:text-primary transition-colors'
    }, 'Clear All');
    clearAllBtn.addEventListener('click', () => this.clearAll());

    header.appendChild(title);
    header.appendChild(clearAllBtn);

    const notificationsList = this.createElement('div', {
      className: 'space-y-4',
      id: 'notifications-list'
    });

    if (this.notifications.length === 0) {
      const emptyState = this.createEmptyState();
      notificationsList.appendChild(emptyState);
    } else {
      this.notifications.forEach(notif => {
        const notifCard = this.createNotificationCard(notif);
        notificationsList.appendChild(notifCard);
      });
    }

    contentContainer.appendChild(header);
    contentContainer.appendChild(notificationsList);
    container.appendChild(contentContainer);

    return container;
  }

  createNotificationCard(notif) {
    const notifCard = this.createElement('div', {
      className: 'bg-slate-800 p-4 rounded-xl hover:bg-slate-700 transition-colors relative group'
    });

    const flexContainer = this.createElement('div', {
      className: 'flex items-center gap-4'
    });

    const avatarContainer = this.createElement('div', {
      className: 'w-12 h-12 rounded-full overflow-hidden bg-slate-700 flex-shrink-0'
    });

    const avatar = this.createElement('img', {
      src: notif.avatar,
      alt: `${notif.user}, Artistry notification`,
      className: 'w-full h-full object-cover'
    });

    avatarContainer.appendChild(avatar);

    const content = this.createElement('div', {
      className: 'flex-1 min-w-0'
    });

    const text = this.createElement('p', {
      className: 'text-sm'
    });

    const userName = this.createElement('span', {
      className: 'font-medium'
    }, notif.user + ' ');

    const action = this.createElement('span', {
      className: 'text-slate-400'
    }, notif.action);

    text.appendChild(userName);
    text.appendChild(action);

    const time = this.createElement('p', {
      className: 'text-xs text-slate-500 mt-1'
    }, notif.time);

    content.appendChild(text);
    content.appendChild(time);

    // Delete button
    const deleteBtn = this.createElement('button', {
      className: 'absolute top-4 right-4 p-2 bg-slate-900 hover:bg-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-all'
    });
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.deleteNotification(notif.id);
    });
    const deleteIcon = this.createIcon('x', 'w-4 h-4');
    deleteBtn.appendChild(deleteIcon);

    flexContainer.appendChild(avatarContainer);
    flexContainer.appendChild(content);
    notifCard.appendChild(flexContainer);
    notifCard.appendChild(deleteBtn);

    return notifCard;
  }

  deleteNotification(id) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.rerender();
  }

  clearAll() {
    if (confirm('Clear all notifications?')) {
      this.notifications = [];
      this.rerender();
    }
  }

  createEmptyState() {
    const emptyState = this.createElement('div', {
      className: 'text-center py-16'
    });

    const icon = this.createIcon('bell-off', 'w-20 h-20 mx-auto mb-4 text-slate-600');
    const title = this.createElement('h3', {
      className: 'text-2xl font-bold mb-2'
    }, 'No notifications');

    const subtitle = this.createElement('p', {
      className: 'text-slate-400'
    }, 'You\'re all caught up!');

    emptyState.appendChild(icon);
    emptyState.appendChild(title);
    emptyState.appendChild(subtitle);

    return emptyState;
  }

  rerender() {
    const pageContainer = document.getElementById('page-container');
    if (pageContainer) {
      pageContainer.innerHTML = '';
      const newElement = this.render();
      pageContainer.appendChild(newElement);
      this.afterRender();
    }
  }
}

