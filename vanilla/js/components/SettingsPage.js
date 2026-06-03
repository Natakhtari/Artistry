import { Component } from './Component.js';
import { stateManager } from '../utils/state.js';
import { router } from '../router.js';
import { api } from '../utils/api.js';
import { toast } from '../utils/toast.js';

/** Account settings — real data only; profile edits live on /profile (Edit Profile). */
export class SettingsPage extends Component {
  render() {
    const user = stateManager.getState().currentUser || {};

    const container = this.createElement('div', {
      className:
        'min-h-screen pb-16 md:pb-8 pt-[max(1rem,env(safe-area-inset-top))] md:pt-20'
    });

    const contentContainer = this.createElement('div', {
      className: 'max-w-3xl mx-auto px-4 md:px-6'
    });

    const title = this.createElement('h1', {
      className: 'text-2xl md:text-3xl font-bold mb-2 md:mb-4 leading-tight'
    }, 'Settings');

    contentContainer.appendChild(title);

    contentContainer.appendChild(this.createElement('p', {
      className: 'text-slate-400 text-sm mb-6 leading-relaxed'
    }, 'To change your name, username, bio, or profile photo, open your profile and use Edit Profile.'));

    const accountCard = this.createElement('div', {
      className: 'bg-slate-800 rounded-2xl p-6 border border-slate-700 space-y-4'
    });
    accountCard.appendChild(this.createElement('h2', {
      className: 'text-lg font-semibold text-slate-200'
    }, 'Account'));
    accountCard.appendChild(this.createElement('p', {
      className: 'text-xs text-slate-500 uppercase tracking-wide'
    }, 'Email'));
    accountCard.appendChild(this.createElement('p', {
      className: 'text-slate-200 break-all'
    }, user.email || '—'));

    const userId = user.id ?? user._raw?.id;
    if (userId) {
      accountCard.appendChild(this.createElement('p', {
        className: 'text-xs text-slate-500 uppercase tracking-wide pt-2'
      }, 'User ID'));
      accountCard.appendChild(this.createElement('p', {
        className: 'text-slate-400 font-mono text-sm'
      }, String(userId)));
    }

    contentContainer.appendChild(accountCard);

    const logoutBtn = this.createElement('button', {
      className: 'w-full px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors mt-8'
    }, 'Log Out');
    logoutBtn.addEventListener('click', () => this.logout());

    contentContainer.appendChild(logoutBtn);
    container.appendChild(contentContainer);

    return container;
  }

  async logout() {
    const confirmed = await toast.confirm('Are you sure you want to log out?', {
      confirmLabel: 'Log Out',
      cancelLabel: 'Cancel',
      danger: true,
    });
    if (!confirmed) return;

    try { await api.auth.logout(); } catch { /* best effort */ }
    stateManager.clearAuth();
    router.navigate('/');
  }
}
