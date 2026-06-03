import { Component } from './Component.js';
import { stateManager } from '../utils/state.js';
import { router } from '../router.js';
import { api } from '../utils/api.js';
import { toast } from '../utils/toast.js';

export class EditProfileModal extends Component {
  constructor(onSaved) {
    super('modal-container');
    this.onSaved = onSaved;
  }

  render() {
    const user = stateManager.getState().currentUser || {};
    const backdrop = this.createElement('div', {
      className: 'fixed inset-0 bg-black/80 z-[10001] flex items-center justify-center p-4 animate-fade-in'
    });
    backdrop.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) this.close();
    });

    const modal = this.createElement('div', {
      className: 'bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto'
    });

    // Header
    const header = this.createElement('div', {
      className: 'flex items-center justify-between p-6 border-b border-slate-700'
    });

    const title = this.createElement('h2', {
      className: 'text-2xl font-bold'
    }, 'Edit Profile');

    const closeButton = this.createElement('button', {
      className: 'p-2 hover:bg-slate-700 rounded-lg transition-colors',
      id: 'modal-close-btn'
    });
    closeButton.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.close();
    });
    const closeIcon = this.createIcon('x', 'w-6 h-6');
    closeButton.appendChild(closeIcon);

    header.appendChild(title);
    header.appendChild(closeButton);

    // Form
    const form = this.createElement('div', {
      className: 'p-6 space-y-6'
    });

    // Avatar Section
    const avatarSection = this.createElement('div', {
      className: 'flex flex-col items-center'
    });

    const avatarContainer = this.createElement('div', {
      className:
        'w-24 h-24 rounded-full overflow-hidden bg-slate-700 mb-3 flex items-center justify-center'
    });
    if (user.avatar) {
      avatarContainer.appendChild(this.createElement('img', {
        src:       user.avatar,
        alt:       user.name || 'Profile',
        className: 'w-full h-full object-cover'
      }));
    } else {
      const initials = (user.name || user.username || '?')
        .replace(/^@/, '')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(w => w[0])
        .join('')
        .toUpperCase() || '?';
      avatarContainer.appendChild(this.createElement('span', {
        className: 'text-2xl font-bold text-slate-300'
      }, initials));
    }

    const photoInput = this.createElement('input', {
      type:     'file',
      accept:   'image/jpeg,image/png,image/webp,image/gif',
      className: 'hidden',
      id:       'edit-profile-photo-input',
    });
    photoInput.addEventListener('change', (e) => this._onPhotoSelected(e));

    const changePhotoBtn = this.createElement('button', {
      type:      'button',
      className: 'text-primary hover:underline text-sm font-medium'
    }, 'Change photo');
    changePhotoBtn.addEventListener('click', () => photoInput.click());

    avatarSection.appendChild(avatarContainer);
    avatarSection.appendChild(changePhotoBtn);
    avatarSection.appendChild(photoInput);

    // Name Input
    const nameGroup = this.createInputGroup('Name', user.name, 'name');

    // Username Input
    const usernameGroup = this.createInputGroup('Username', user.username, 'username');
    // Bio Input
    const bioLabel = this.createElement('label', {
      className: 'block text-sm font-medium mb-2',
      for:       'edit-profile-bio'
    }, 'Bio');

    const bioTextarea = this.createElement('textarea', {
      id:        'edit-profile-bio',
      rows:      4,
      className: 'w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-primary transition-colors resize-none',
      value:     user.bio || ''
    });

    const bioGroup = this.createElement('div', {
      className: 'space-y-2'
    });
    bioGroup.appendChild(bioLabel);
    bioGroup.appendChild(bioTextarea);

    // Footer
    const footer = this.createElement('div', {
      className: 'flex gap-3 justify-end p-6 border-t border-slate-700'
    });

    const cancelBtn = this.createElement('button', {
      className: 'px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors'
    }, 'Cancel');
    cancelBtn.addEventListener('click', () => this.close());

    const saveBtn = this.createElement('button', {
      id:        'edit-profile-save-btn',
      className: 'px-6 py-2 bg-primary hover:bg-primary-hover rounded-lg transition-colors'
    }, 'Save Changes');
    saveBtn.addEventListener('click', () => this.save());

    footer.appendChild(cancelBtn);
    footer.appendChild(saveBtn);

    // Assemble
    form.appendChild(avatarSection);
    form.appendChild(nameGroup);
    form.appendChild(usernameGroup);
    form.appendChild(bioGroup);

    modal.appendChild(header);
    modal.appendChild(form);
    modal.appendChild(footer);
    backdrop.appendChild(modal);

    return backdrop;
  }

  async _onPhotoSelected(e) {
    const input = e.target;
    const file    = input?.files?.[0];
    if (input) input.value = '';
    if (!file || !file.type.startsWith('image/')) return;

    try {
      toast.info('Uploading photo…');
      const up = await api.upload(file);
      const url = up?.data?.url;
      if (!url) throw new Error('Upload did not return a URL');

      const res = await api.users.updateProfile({ profile_picture_url: url });
      stateManager.setUser(res.data);
      toast.success('Profile photo updated');
      if (this.onSaved) this.onSaved();
      this.close();
    } catch (err) {
      toast.error(err.message || 'Could not update profile photo.');
    }
  }

  createInputGroup(label, value, id) {
    const group = this.createElement('div', {
      className: 'space-y-2'
    });

    const labelEl = this.createElement('label', {
      className: 'block text-sm font-medium',
      for: id
    }, label);

    const input = this.createElement('input', {
      type: 'text',
      id: id,
      className: 'w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-primary transition-colors',
      value: value
    });

    group.appendChild(labelEl);
    group.appendChild(input);

    return group;
  }

  async save() {
    const nameVal     = document.getElementById('name')?.value?.trim() ?? '';
    const usernameVal = document.getElementById('username')?.value?.trim().replace(/^@/, '') ?? '';
    const bio         = document.getElementById('edit-profile-bio')?.value?.trim() ?? '';
    const saveBtn     = document.getElementById('edit-profile-save-btn');

    if (!nameVal) { toast.error('Name cannot be empty.'); return; }
    if (usernameVal && usernameVal.length < 3) { toast.error('Username must be at least 3 characters.'); return; }

    const parts     = nameVal.split(/\s+/);
    const firstName = parts[0] ?? '';
    const lastName  = parts.slice(1).join(' ') || '';

    if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Saving…'; }

    const payload = { bio, first_name: firstName, last_name: lastName };
    if (usernameVal) payload.username = usernameVal;

    try {
      const res = await api.users.updateProfile(payload);
      stateManager.setUser(res.data);
      toast.success('Profile updated!');
      if (this.onSaved) this.onSaved();
      this.close();
    } catch (err) {
      toast.error(err.message || 'Could not save profile.');
      if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Save Changes'; }
    }
  }

  close() {
    const modalContainer = document.getElementById('modal-container');
    if (modalContainer) modalContainer.innerHTML = '';
    document.body.style.overflow = '';
  }

  mount() {
    let container = document.getElementById('modal-container');
    
    if (!container) {
      container = document.createElement('div');
      container.id = 'modal-container';
      document.body.appendChild(container);
    }

    container.innerHTML = '';
    document.body.style.overflow = 'hidden';
    const element = this.render();
    container.appendChild(element);
    this.afterRender();
  }
}

