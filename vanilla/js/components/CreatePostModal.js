import { Component } from './Component.js';
import { stateManager } from '../utils/state.js';

export class CreatePostModal extends Component {
  constructor(onClose, onSubmit) {
    super('create-post-modal');
    this.onClose = onClose;
    this.onSubmit = onSubmit;
    this.selectedType = 'artwork';
    this.previewUrl = null;
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
    }, 'Create New Post');

    const closeButton = this.createElement('button', {
      className: 'p-2 hover:bg-slate-700 rounded-lg transition-colors',
      id: 'create-post-close-btn'
    });
    closeButton.addEventListener('click', () => this.close());
    const closeIcon = this.createIcon('x', 'w-6 h-6');
    closeButton.appendChild(closeIcon);

    header.appendChild(title);
    header.appendChild(closeButton);

    // Form
    const form = this.createElement('div', {
      className: 'p-6 space-y-6'
    });

    // Type Selector
    const typeSection = this.createTypeSelector();
    
    // Image Upload
    const imageSection = this.createImageUpload();
    
    // Title Input
    const titleGroup = this.createInputGroup('Title', 'Give your post a title...', 'post-title');
    
    // Description Input
    const descLabel = this.createElement('label', {
      className: 'block text-sm font-medium mb-2'
    }, 'Description');

    const descTextarea = this.createElement('textarea', {
      rows: 4,
      className: 'w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-primary transition-colors resize-none',
      placeholder: 'Describe your creation...',
      id: 'post-description'
    });

    const descGroup = this.createElement('div', {
      className: 'space-y-2'
    });
    descGroup.appendChild(descLabel);
    descGroup.appendChild(descTextarea);

    // Footer
    const footer = this.createElement('div', {
      className: 'flex gap-3 justify-end p-6 border-t border-slate-700'
    });

    const cancelBtn = this.createElement('button', {
      className: 'px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors'
    }, 'Cancel');
    cancelBtn.addEventListener('click', () => this.close());

    const publishBtn = this.createElement('button', {
      className: 'px-6 py-2 bg-primary hover:bg-primary-hover rounded-lg transition-colors',
      style: 'background-color: #F25C54'
    }, 'Publish');
    publishBtn.addEventListener('click', () => this.handlePublish());
    publishBtn.addEventListener('mouseenter', (e) => {
      e.target.style.backgroundColor = '#D93830';
    });
    publishBtn.addEventListener('mouseleave', (e) => {
      e.target.style.backgroundColor = '#F25C54';
    });

    footer.appendChild(cancelBtn);
    footer.appendChild(publishBtn);

    // Assemble
    form.appendChild(typeSection);
    form.appendChild(imageSection);
    form.appendChild(titleGroup);
    form.appendChild(descGroup);

    modal.appendChild(header);
    modal.appendChild(form);
    modal.appendChild(footer);
    backdrop.appendChild(modal);

    return backdrop;
  }

  createTypeSelector() {
    const section = this.createElement('div', {
      className: 'space-y-2'
    });

    const label = this.createElement('label', {
      className: 'block text-sm font-medium mb-2'
    }, 'Content Type');

    const types = [
      { value: 'artwork', label: 'Artwork', icon: 'image' },
      { value: 'video', label: 'Video', icon: 'video' },
      { value: 'podcast', label: 'Podcast', icon: 'mic' },
      { value: 'article', label: 'Article', icon: 'file-text' }
    ];

    const buttonsContainer = this.createElement('div', {
      className: 'grid grid-cols-2 md:grid-cols-4 gap-3'
    });

    types.forEach(type => {
      const btn = this.createElement('button', {
        className: `p-4 rounded-lg border-2 transition-all ${
          this.selectedType === type.value 
            ? 'border-primary bg-slate-700' 
            : 'border-slate-700 hover:border-slate-600'
        }`,
        id: `type-${type.value}`,
        style: this.selectedType === type.value ? 'border-color: #F25C54' : ''
      });
      
      btn.addEventListener('click', () => this.selectType(type.value));

      const icon = this.createIcon(type.icon, 'w-6 h-6 mx-auto mb-2');
      const text = this.createElement('div', {
        className: 'text-sm font-medium'
      }, type.label);

      btn.appendChild(icon);
      btn.appendChild(text);
      buttonsContainer.appendChild(btn);
    });

    section.appendChild(label);
    section.appendChild(buttonsContainer);

    return section;
  }

  createImageUpload() {
    const section = this.createElement('div', {
      className: 'space-y-2'
    });

    const label = this.createElement('label', {
      className: 'block text-sm font-medium mb-2'
    }, 'Image / Thumbnail');

    const uploadArea = this.createElement('div', {
      className: 'border-2 border-dashed border-slate-700 rounded-lg p-8 text-center hover:border-slate-600 transition-colors cursor-pointer',
      id: 'upload-area'
    });

    const uploadIcon = this.createIcon('upload', 'w-12 h-12 mx-auto mb-4 text-slate-500');
    const uploadText = this.createElement('p', {
      className: 'text-slate-400 mb-2'
    }, 'Click to upload or drag and drop');
    const uploadHint = this.createElement('p', {
      className: 'text-sm text-slate-500'
    }, 'PNG, JPG, GIF up to 10MB');

    // Hidden file input
    const fileInput = this.createElement('input', {
      type: 'file',
      accept: 'image/*',
      className: 'hidden',
      id: 'post-image-input'
    });
    fileInput.addEventListener('change', (e) => this.handleImageSelect(e));

    uploadArea.addEventListener('click', () => fileInput.click());

    uploadArea.appendChild(uploadIcon);
    uploadArea.appendChild(uploadText);
    uploadArea.appendChild(uploadHint);
    uploadArea.appendChild(fileInput);

    // Preview area
    const preview = this.createElement('div', {
      className: 'hidden mt-4 relative',
      id: 'image-preview'
    });

    section.appendChild(label);
    section.appendChild(uploadArea);
    section.appendChild(preview);

    return section;
  }

  createInputGroup(label, placeholder, id) {
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
      placeholder: placeholder
    });

    group.appendChild(labelEl);
    group.appendChild(input);

    return group;
  }

  selectType(type) {
    console.log('CreatePostModal: Type selected:', type);
    this.selectedType = type;
    
    // Update button styles
    const types = ['artwork', 'video', 'podcast', 'article'];
    types.forEach(t => {
      const btn = document.getElementById(`type-${t}`);
      if (btn) {
        if (t === type) {
          btn.className = 'p-4 rounded-lg border-2 transition-all border-primary bg-slate-700';
          btn.style.borderColor = '#F25C54';
        } else {
          btn.className = 'p-4 rounded-lg border-2 transition-all border-slate-700 hover:border-slate-600';
          btn.style.borderColor = '';
        }
      }
    });
  }

  handleImageSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    console.log('CreatePostModal: Image selected:', file.name);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      this.previewUrl = event.target.result;
      this.showPreview(event.target.result);
    };
    reader.readAsDataURL(file);
  }

  showPreview(url) {
    const uploadArea = document.getElementById('upload-area');
    const preview = document.getElementById('image-preview');
    
    if (uploadArea && preview) {
      uploadArea.classList.add('hidden');
      preview.classList.remove('hidden');
      
      preview.innerHTML = '';
      
      const img = this.createElement('img', {
        src: url,
        className: 'w-full h-64 object-cover rounded-lg',
        alt: 'Preview'
      });
      
      const removeBtn = this.createElement('button', {
        className: 'absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 rounded-full transition-colors'
      });
      const removeIcon = this.createIcon('x', 'w-5 h-5');
      removeBtn.appendChild(removeIcon);
      removeBtn.addEventListener('click', () => this.removeImage());
      
      preview.appendChild(img);
      preview.appendChild(removeBtn);
    }
  }

  removeImage() {
    console.log('CreatePostModal: Removing image');
    this.previewUrl = null;
    const uploadArea = document.getElementById('upload-area');
    const preview = document.getElementById('image-preview');
    
    if (uploadArea && preview) {
      uploadArea.classList.remove('hidden');
      preview.classList.add('hidden');
      preview.innerHTML = '';
    }
    
    const fileInput = document.getElementById('post-image-input');
    if (fileInput) {
      fileInput.value = '';
    }
  }

  handlePublish() {
    console.log('CreatePostModal: Publishing post');
    
    const title = document.getElementById('post-title')?.value;
    const description = document.getElementById('post-description')?.value;
    
    if (!title || !title.trim()) {
      alert('Please enter a title for your post');
      return;
    }
    
    if (!this.previewUrl) {
      alert('Please upload an image for your post');
      return;
    }

    const user = stateManager.getState().currentUser;
    
    const newPost = {
      id: Date.now(),
      type: this.selectedType,
      image: this.previewUrl,
      thumbnail: this.previewUrl,
      cover: this.previewUrl,
      artist: user.name,
      avatar: user.avatar,
      likes: 0,
      title: title.trim(),
      description: description.trim() || 'No description',
      views: this.selectedType === 'video' ? '0' : undefined,
      duration: this.selectedType === 'video' ? '0:00' : 
                this.selectedType === 'podcast' ? '0 min' : undefined,
      readTime: this.selectedType === 'article' ? '1 min read' : undefined
    };

    console.log('CreatePostModal: New post created:', newPost);

    if (this.onSubmit) {
      this.onSubmit(newPost);
    }

    this.close();
  }

  close() {
    console.log('CreatePostModal: Closing');
    const modalContainer = document.getElementById('create-post-modal');
    if (modalContainer) {
      modalContainer.innerHTML = '';
    }
    if (this.onClose) {
      this.onClose();
    }
  }

  mount() {
    console.log('CreatePostModal: mount() called');
    let container = document.getElementById('create-post-modal');
    
    if (!container) {
      console.log('CreatePostModal: Creating create-post-modal container');
      container = document.createElement('div');
      container.id = 'create-post-modal';
      document.body.appendChild(container);
    }

    container.innerHTML = '';
    const element = this.render();
    container.appendChild(element);
    this.afterRender();
  }
}

