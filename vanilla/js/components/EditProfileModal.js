import { Component } from './Component.js';
import { stateManager } from '../utils/state.js';
import { router } from '../router.js';

export class EditProfileModal extends Component {
  constructor(onClose) {
    super('modal-container');
    this.onClose = onClose;
    this.user = stateManager.getState().currentUser;
  }

  render() {
    const backdrop = this.createElement('div', {
      className: 'fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in'
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
      console.log('EditProfileModal: Close button clicked');
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
      className: 'w-24 h-24 rounded-full overflow-hidden bg-slate-700 mb-3'
    });

    const avatar = this.createElement('img', {
      src: this.user.avatar,
      alt: this.user.name,
      className: 'w-full h-full object-cover'
    });

    const changePhotoBtn = this.createElement('button', {
      className: 'text-primary hover:text-primary text-sm font-medium'
    }, 'Change Photo');

    avatarContainer.appendChild(avatar);
    avatarSection.appendChild(avatarContainer);
    avatarSection.appendChild(changePhotoBtn);

    // Name Input
    const nameGroup = this.createInputGroup('Name', this.user.name, 'name');
    
    // Username Input
    const usernameGroup = this.createInputGroup('Username', this.user.username, 'username');
    
    // Bio Input
    const bioLabel = this.createElement('label', {
      className: 'block text-sm font-medium mb-2'
    }, 'Bio');

    const bioTextarea = this.createElement('textarea', {
      rows: 4,
      className: 'w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-primary transition-colors resize-none',
      placeholder: 'Tell us about yourself...'
    });
    bioTextarea.value = this.user.bio;

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

  save() {
    alert('Profile saved! (This would save to a backend in a real app)');
    this.close();
  }

  close() {
    console.log('EditProfileModal: Closing...');
    const modalContainer = document.getElementById('modal-container');
    if (modalContainer) {
      console.log('EditProfileModal: Removing modal');
      modalContainer.innerHTML = '';
    } else {
      console.log('EditProfileModal: Container not found');
    }
    if (this.onClose) {
      console.log('EditProfileModal: Calling onClose callback');
      this.onClose();
    }
  }

  mount() {
    let container = document.getElementById('modal-container');
    
    if (!container) {
      container = document.createElement('div');
      container.id = 'modal-container';
      document.body.appendChild(container);
    }

    container.innerHTML = '';
    const element = this.render();
    container.appendChild(element);
    this.afterRender();
  }
}

