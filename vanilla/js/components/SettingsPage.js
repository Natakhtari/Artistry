import { Component } from './Component.js';
import { stateManager } from '../utils/state.js';
import { router } from '../router.js';

export class SettingsPage extends Component {
  render() {
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

    const settingsGroups = this.createElement('div', {
      className: 'space-y-6'
    });

    // Account Settings
    const accountSection = this.createEditableSection('Account', [
      { label: 'Email', value: 'alex@artistry.com', id: 'email', type: 'email' },
      { label: 'Password', value: '••••••••', id: 'password', type: 'password' },
      { label: 'Phone', value: '+1 (555) 123-4567', id: 'phone', type: 'tel' }
    ]);

    // Privacy Settings
    const privacySection = this.createSelectSection('Privacy', [
      { label: 'Profile Visibility', value: 'Public', id: 'visibility', options: ['Public', 'Private', 'Friends Only'] },
      { label: 'Show Activity Status', value: 'Enabled', id: 'activity', options: ['Enabled', 'Disabled'] },
      { label: 'Allow Messages', value: 'Everyone', id: 'messages', options: ['Everyone', 'Friends', 'Nobody'] }
    ]);

    // Notifications Settings
    const notifSection = this.createToggleSection('Notifications', [
      { label: 'Email Notifications', enabled: true, id: 'email-notif' },
      { label: 'Push Notifications', enabled: true, id: 'push-notif' },
      { label: 'SMS Notifications', enabled: false, id: 'sms-notif' }
    ]);

    // Logout Button
    const logoutBtn = this.createElement('button', {
      className: 'w-full px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors mt-8'
    }, 'Log Out');
    logoutBtn.addEventListener('click', () => this.logout());

    settingsGroups.appendChild(accountSection);
    settingsGroups.appendChild(privacySection);
    settingsGroups.appendChild(notifSection);
    contentContainer.appendChild(title);
    contentContainer.appendChild(settingsGroups);
    contentContainer.appendChild(logoutBtn);
    container.appendChild(contentContainer);

    return container;
  }

  createEditableSection(title, items) {
    const section = this.createElement('div', {
      className: 'bg-slate-800 rounded-2xl p-6'
    });

    const sectionTitle = this.createElement('h2', {
      className: 'text-xl font-bold mb-4'
    }, title);

    const itemsList = this.createElement('div', {
      className: 'space-y-4'
    });

    items.forEach(item => {
      const itemDiv = this.createElement('div', {
        className: 'space-y-2'
      });

      const label = this.createElement('label', {
        className: 'block text-sm font-medium text-slate-300',
        for: item.id
      }, item.label);

      const input = this.createElement('input', {
        type: item.type,
        id: item.id,
        value: item.value,
        className: 'w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-primary transition-colors'
      });
      input.addEventListener('change', () => this.saveSetting(item.id));

      itemDiv.appendChild(label);
      itemDiv.appendChild(input);
      itemsList.appendChild(itemDiv);
    });

    section.appendChild(sectionTitle);
    section.appendChild(itemsList);

    return section;
  }

  createSelectSection(title, items) {
    const section = this.createElement('div', {
      className: 'bg-slate-800 rounded-2xl p-6'
    });

    const sectionTitle = this.createElement('h2', {
      className: 'text-xl font-bold mb-4'
    }, title);

    const itemsList = this.createElement('div', {
      className: 'space-y-4'
    });

    items.forEach(item => {
      const itemDiv = this.createElement('div', {
        className: 'flex items-center justify-between py-3 border-b border-slate-700 last:border-0'
      });

      const label = this.createElement('span', {
        className: 'text-slate-300'
      }, item.label);

      const select = this.createElement('select', {
        id: item.id,
        className: 'px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-primary transition-colors'
      });
      select.addEventListener('change', () => this.saveSetting(item.id));

      item.options.forEach(option => {
        const optionEl = this.createElement('option', {
          value: option,
          selected: option === item.value
        }, option);
        select.appendChild(optionEl);
      });

      itemDiv.appendChild(label);
      itemDiv.appendChild(select);
      itemsList.appendChild(itemDiv);
    });

    section.appendChild(sectionTitle);
    section.appendChild(itemsList);

    return section;
  }

  createToggleSection(title, items) {
    const section = this.createElement('div', {
      className: 'bg-slate-800 rounded-2xl p-6'
    });

    const sectionTitle = this.createElement('h2', {
      className: 'text-xl font-bold mb-4'
    }, title);

    const itemsList = this.createElement('div', {
      className: 'space-y-4'
    });

    items.forEach(item => {
      const itemDiv = this.createElement('div', {
        className: 'flex items-center justify-between py-3 border-b border-slate-700 last:border-0'
      });

      const label = this.createElement('span', {
        className: 'text-slate-300'
      }, item.label);

      const toggleContainer = this.createElement('label', {
        className: 'relative inline-flex items-center cursor-pointer'
      });

      const checkbox = this.createElement('input', {
        type: 'checkbox',
        id: item.id,
        checked: item.enabled,
        className: 'sr-only peer'
      });
      checkbox.addEventListener('change', () => this.saveSetting(item.id));

      const toggleBg = this.createElement('div', {
        className: "w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"
      });

      toggleContainer.appendChild(checkbox);
      toggleContainer.appendChild(toggleBg);

      itemDiv.appendChild(label);
      itemDiv.appendChild(toggleContainer);
      itemsList.appendChild(itemDiv);
    });

    section.appendChild(sectionTitle);
    section.appendChild(itemsList);

    return section;
  }

  saveSetting(id) {
    console.log('Saving setting:', id);
    // Show a brief success message
    const message = this.createElement('div', {
      className: 'fixed bottom-24 md:bottom-8 right-8 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg animate-slide-up'
    }, '✓ Saved');
    
    document.body.appendChild(message);
    
    setTimeout(() => {
      message.remove();
    }, 2000);
  }

  logout() {
    if (confirm('Are you sure you want to log out?')) {
      stateManager.setState({ isAuthenticated: false });
      router.navigate('/auth');
    }
  }
}

