import { Component } from './Component.js';
import { stateManager } from '../utils/state.js';
import { api } from '../utils/api.js';
import { toast } from '../utils/toast.js';

const TYPES = [
  { value: 'photo',   label: 'Photo',   icon: 'image'     },
  { value: 'video',   label: 'Video',   icon: 'video'     },
  { value: 'podcast', label: 'Podcast', icon: 'mic'       },
  { value: 'article', label: 'Article', icon: 'file-text' },
];

export class CreatePostModal extends Component {
  constructor(onClose, onSubmit) {
    super('create-post-modal');
    this.onClose      = onClose;
    this.onSubmit     = onSubmit;
    this.selectedType = 'photo';
    this.uploadedFile = null;
    this.previewUrl   = null;
    this.tagInput     = '';
  }

  // ── Render ────────────────────────────────────────────────────────────────

  render() {
    const backdrop = this.createElement('div', {
      className: 'fixed inset-0 bg-black/80 z-[10001] flex items-center justify-center p-4'
    });
    backdrop.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) this.close();
    });

    const modal = this.createElement('div', {
      className: 'bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto'
    });

    modal.appendChild(this._buildHeader());
    modal.appendChild(this._buildForm());
    modal.appendChild(this._buildFooter());
    backdrop.appendChild(modal);

    return backdrop;
  }

  _buildHeader() {
    const header = this.createElement('div', {
      className: 'flex items-center justify-between p-6 border-b border-slate-700'
    });
    header.appendChild(this.createElement('h2', { className: 'text-2xl font-bold' }, 'Create New Post'));

    const closeBtn = this.createElement('button', {
      className: 'p-2 hover:bg-slate-700 rounded-lg transition-colors'
    });
    closeBtn.addEventListener('click', () => this.close());
    closeBtn.appendChild(this.createIcon('x', 'w-6 h-6'));
    header.appendChild(closeBtn);

    return header;
  }

  _buildForm() {
    const form = this.createElement('div', { className: 'p-6 space-y-6' });

    form.appendChild(this._buildTypeSelector());

    const fields = this.createElement('div', { id: 'cpm-fields' });
    form.appendChild(fields);

    // Tags — shared across all types
    const tagsWrap = this.createElement('div', { className: 'space-y-1' });
    tagsWrap.appendChild(this.createElement('label', {
      className: 'block text-sm font-medium',
      for: 'cpm-tags'
    }, 'Tags (comma-separated)'));
    const tagsInput = this.createElement('input', {
      type:        'text',
      id:          'cpm-tags',
      placeholder: 'e.g. digital, portrait, abstract',
      className:   'w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-primary transition-colors text-sm',
    });
    tagsWrap.appendChild(tagsInput);
    tagsWrap.appendChild(this.createElement('p', {
      className: 'text-xs text-slate-500 mt-1'
    }, 'Tags help others discover your work'));
    form.appendChild(tagsWrap);

    return form;
  }

  _buildTypeSelector() {
    const wrap = this.createElement('div', { className: 'space-y-2' });
    wrap.appendChild(this.createElement('label', { className: 'block text-sm font-medium mb-2' }, 'Content Type'));

    const grid = this.createElement('div', { className: 'grid grid-cols-2 md:grid-cols-4 gap-3' });

    TYPES.forEach(({ value, label, icon }) => {
      const btn = this.createElement('button', {
        id:        `cpm-type-${value}`,
        className: this._typeClass(value),
      });
      btn.addEventListener('click', () => this._selectType(value));
      btn.appendChild(this.createIcon(icon, 'w-6 h-6 mx-auto mb-2'));
      btn.appendChild(this.createElement('div', { className: 'text-sm font-medium' }, label));
      grid.appendChild(btn);
    });

    wrap.appendChild(grid);
    return wrap;
  }

  _buildFooter() {
    const footer = this.createElement('div', {
      className: 'flex gap-3 justify-end p-6 border-t border-slate-700'
    });

    const cancelBtn = this.createElement('button', {
      className: 'px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors'
    }, 'Cancel');
    cancelBtn.addEventListener('click', () => this.close());

    const publishBtn = this.createElement('button', {
      id:        'cpm-publish-btn',
      className: 'px-6 py-2 bg-primary hover:bg-primary-hover rounded-lg transition-colors font-medium'
    }, 'Publish');
    publishBtn.addEventListener('click', () => this._handlePublish());

    footer.appendChild(cancelBtn);
    footer.appendChild(publishBtn);
    return footer;
  }

  // ── Type switching ────────────────────────────────────────────────────────

  _typeClass(value) {
    const active = value === this.selectedType;
    return `p-4 rounded-lg border-2 transition-all text-center ${
      active
        ? 'border-primary bg-slate-700'
        : 'border-slate-700 hover:border-slate-600'
    }`;
  }

  _selectType(value) {
    this.selectedType = value;
    this.uploadedFile = null;
    this.previewUrl   = null;

    TYPES.forEach(({ value: v }) => {
      const btn = document.getElementById(`cpm-type-${v}`);
      if (btn) btn.className = this._typeClass(v);
    });

    this._renderFields();
    if (window.lucide) window.lucide.createIcons();
  }

  // ── Dynamic fields per type ───────────────────────────────────────────────

  _renderFields() {
    const area = document.getElementById('cpm-fields');
    if (!area) return;
    area.innerHTML = '';

    switch (this.selectedType) {
      case 'photo':   area.appendChild(this._fieldsPhoto());   break;
      case 'video':   area.appendChild(this._fieldsVideo());   break;
      case 'podcast': area.appendChild(this._fieldsPodcast()); break;
      case 'article': area.appendChild(this._fieldsArticle()); break;
    }
  }

  // Photo ────────────────────────────────────────────────────────────────────

  _fieldsPhoto() {
    const wrap = this.createElement('div', { className: 'space-y-4' });
    wrap.appendChild(this._buildFileUploader('Upload Photo', 'image/*', 'Photo (JPG, PNG, GIF, WebP — max 50 MB)'));
    wrap.appendChild(this._buildInput('Title', 'Give your photo a title…', 'cpm-title', true));
    wrap.appendChild(this._buildTextarea('Description', 'Tell us about this photo…', 'cpm-desc'));
    return wrap;
  }

  // Video ────────────────────────────────────────────────────────────────────

  _fieldsVideo() {
    const wrap = this.createElement('div', { className: 'space-y-4' });
    wrap.appendChild(this._buildInput('Video URL *', 'https://youtube.com/watch?v=… or direct .mp4 link', 'cpm-media-url', true));
    wrap.appendChild(this._buildInput('Thumbnail URL (optional)', 'https://…', 'cpm-thumb-url', false));
    wrap.appendChild(this._buildInput('Title', 'Give your video a title…', 'cpm-title', true));
    wrap.appendChild(this._buildTextarea('Description', 'What is this video about?', 'cpm-desc'));
    return wrap;
  }

  // Podcast ──────────────────────────────────────────────────────────────────

  _fieldsPodcast() {
    const wrap = this.createElement('div', { className: 'space-y-4' });
    wrap.appendChild(this._buildInput('Audio URL *', 'https://spotify.com/… or direct .mp3 link', 'cpm-media-url', true));
    wrap.appendChild(this._buildInput('Cover Image URL (optional)', 'https://…', 'cpm-thumb-url', false));
    wrap.appendChild(this._buildInput('Episode Title', 'Give your episode a title…', 'cpm-title', true));
    wrap.appendChild(this._buildTextarea('Description / Show Notes', 'What is this episode about?', 'cpm-desc'));
    return wrap;
  }

  // Article ──────────────────────────────────────────────────────────────────

  _fieldsArticle() {
    const wrap = this.createElement('div', { className: 'space-y-4' });
    wrap.appendChild(this._buildFileUploader('Cover Image (optional)', 'image/*', 'JPG, PNG, WebP — max 50 MB'));
    wrap.appendChild(this._buildInput('Title', 'Article headline…', 'cpm-title', true));
    wrap.appendChild(this._buildTextarea('Article Body *', 'Write your article here…', 'cpm-article-body', 10));
    wrap.appendChild(this._buildTextarea('Short Description (optional)', 'A brief summary shown in previews…', 'cpm-desc', 3));
    return wrap;
  }

  // ── Shared field builders ─────────────────────────────────────────────────

  _buildInput(label, placeholder, id, required = false) {
    const wrap = this.createElement('div', { className: 'space-y-1' });

    const lbl = this.createElement('label', { className: 'block text-sm font-medium', for: id }, label);

    const inp = this.createElement('input', {
      type:        'text',
      id,
      placeholder,
      className:   'w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-primary transition-colors',
    });

    wrap.appendChild(lbl);
    wrap.appendChild(inp);
    return wrap;
  }

  _buildTextarea(label, placeholder, id, rows = 4) {
    const wrap = this.createElement('div', { className: 'space-y-1' });

    wrap.appendChild(this.createElement('label', { className: 'block text-sm font-medium', for: id }, label));

    const ta = this.createElement('textarea', {
      id,
      rows,
      placeholder,
      className: 'w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-primary transition-colors resize-none',
    });
    wrap.appendChild(ta);
    return wrap;
  }

  _buildFileUploader(label, accept, hint) {
    const wrap = this.createElement('div', { className: 'space-y-2' });

    wrap.appendChild(this.createElement('label', { className: 'block text-sm font-medium' }, label));

    const uploadArea = this.createElement('div', {
      id:        'cpm-upload-area',
      className: 'border-2 border-dashed border-slate-700 rounded-lg p-8 text-center hover:border-slate-500 transition-colors cursor-pointer',
    });
    uploadArea.appendChild(this.createIcon('upload', 'w-12 h-12 mx-auto mb-4 text-slate-500'));
    uploadArea.appendChild(this.createElement('p', { className: 'text-slate-400 mb-1' }, 'Click to upload or drag and drop'));
    uploadArea.appendChild(this.createElement('p', { className: 'text-sm text-slate-500' }, hint));

    const fileInput = this.createElement('input', {
      type:      'file',
      accept,
      className: 'hidden',
      id:        'cpm-file-input',
    });
    fileInput.addEventListener('change', (e) => this._onFileSelected(e));
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.classList.add('border-primary'); });
    uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('border-primary'));
    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('border-primary');
      const file = e.dataTransfer?.files?.[0];
      if (file) this._applyFile(file);
    });

    uploadArea.appendChild(fileInput);
    wrap.appendChild(uploadArea);

    const preview = this.createElement('div', { id: 'cpm-preview', className: 'hidden mt-3 relative' });
    wrap.appendChild(preview);

    return wrap;
  }

  // ── File handling ─────────────────────────────────────────────────────────

  _onFileSelected(e) {
    const file = e.target.files?.[0];
    if (file) this._applyFile(file);
  }

  _applyFile(file) {
    this.uploadedFile = file;
    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
    this.previewUrl = URL.createObjectURL(file);
    this._showPreview(this.previewUrl, file.name);
  }

  _showPreview(url, name) {
    const uploadArea = document.getElementById('cpm-upload-area');
    const preview    = document.getElementById('cpm-preview');
    if (!uploadArea || !preview) return;

    uploadArea.classList.add('hidden');
    preview.classList.remove('hidden');
    preview.innerHTML = '';

    const img = this.createElement('img', {
      src:       url,
      alt:       name,
      className: 'w-full h-56 object-cover rounded-lg',
    });

    const nameTag = this.createElement('p', {
      className: 'text-xs text-slate-400 mt-1 truncate'
    }, name);

    const removeBtn = this.createElement('button', {
      className: 'absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-700 rounded-full transition-colors'
    });
    removeBtn.appendChild(this.createIcon('x', 'w-4 h-4'));
    removeBtn.addEventListener('click', () => this._removeFile());

    preview.appendChild(img);
    preview.appendChild(nameTag);
    preview.appendChild(removeBtn);

    if (window.lucide) window.lucide.createIcons();
  }

  _removeFile() {
    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
    this.uploadedFile = null;
    this.previewUrl   = null;

    const uploadArea = document.getElementById('cpm-upload-area');
    const preview    = document.getElementById('cpm-preview');
    const fileInput  = document.getElementById('cpm-file-input');
    if (uploadArea) uploadArea.classList.remove('hidden');
    if (preview)    { preview.classList.add('hidden'); preview.innerHTML = ''; }
    if (fileInput)  fileInput.value = '';
  }

  // ── Publish ───────────────────────────────────────────────────────────────

  async _handlePublish() {
    const title = document.getElementById('cpm-title')?.value?.trim();
    if (!title) { toast.error('Please enter a title.'); return; }

    const publishBtn = document.getElementById('cpm-publish-btn');
    const setLoading = (on) => {
      if (!publishBtn) return;
      publishBtn.disabled    = on;
      publishBtn.textContent = on ? 'Publishing…' : 'Publish';
    };

    setLoading(true);

    try {
      const tagNames = (document.getElementById('cpm-tags')?.value ?? '')
        .split(',').map(t => t.trim()).filter(Boolean);

      if (this.selectedType === 'article') {
        await this._publishArticle(title, tagNames);
      } else {
        await this._publishArtwork(title, tagNames);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to publish. Please try again.');
      setLoading(false);
    }
  }

  async _publishArtwork(title, tagNames) {
    const mediaUrl = await this._resolveMediaUrl();
    if (!mediaUrl) {
      toast.error(this.selectedType === 'photo'
        ? 'Please upload a photo.'
        : 'Please provide a URL for your content.');
      document.getElementById('cpm-publish-btn').disabled = false;
      document.getElementById('cpm-publish-btn').textContent = 'Publish';
      return;
    }

    const description = document.getElementById('cpm-desc')?.value?.trim() || '';
    const res = await api.artworks.create({
      title,
      description,
      content_type: this.selectedType,
      media_url:    mediaUrl,
      status:       'published',
    });

    const artworkId = res.data?.id;
    if (artworkId && tagNames.length) {
      await this._applyTagsToArtwork(artworkId, tagNames);
    }

    const user = stateManager.getState().user ?? stateManager.getState().currentUser;
    if (this.onSubmit) this.onSubmit({
      id:          artworkId,
      type:        this.selectedType,
      image:       mediaUrl,
      thumbnail:   mediaUrl,
      artist:      user?.name || user?.username || 'You',
      avatar:      user?.avatar || '',
      likes:       0,
      title,
      description,
    });
    toast.success('Post published!');
    this.close();
  }

  async _publishArticle(title, tagNames) {
    const coverUrl    = await this._resolveArticleCover();
    const articleBody = document.getElementById('cpm-article-body')?.value?.trim() ?? '';
    if (!articleBody) {
      toast.error('Please write the article body.');
      document.getElementById('cpm-publish-btn').disabled = false;
      document.getElementById('cpm-publish-btn').textContent = 'Publish';
      return;
    }

    const description = document.getElementById('cpm-desc')?.value?.trim() || '';
    const res = await api.blogPosts.create({
      title,
      body:                articleBody,
      featured_image_url:  coverUrl || null,
      status:              'published',
      tags:                tagNames,
    });

    const postId = res.data?.id;
    toast.success('Article published!');
    this.close();

    if (this.onSubmit) this.onSubmit({
      id:          postId,
      type:        'article',
      title,
      description: description || articleBody.slice(0, 120) + (articleBody.length > 120 ? '…' : ''),
      image:       coverUrl || null,
    });
  }

  async _applyTagsToArtwork(artworkId, names) {
    for (const name of names) {
      try {
        const tagRes = await api.tags.upsert(name);
        const tagId  = tagRes.data?.id;
        if (tagId) await api.tags.addToArtwork(artworkId, tagId);
      } catch { /* non-fatal */ }
    }
  }

  /** Returns a URL string for the media, uploading a file first if needed. */
  async _resolveMediaUrl() {
    if (this.selectedType === 'photo') {
      if (!this.uploadedFile) return null;
      const uploadRes = await api.upload(this.uploadedFile);
      return uploadRes.data?.url || null;
    }
    const urlInput = document.getElementById('cpm-media-url');
    return urlInput?.value?.trim() || null;
  }

  async _resolveArticleCover() {
    if (!this.uploadedFile) return null;
    const uploadRes = await api.upload(this.uploadedFile);
    return uploadRes.data?.url || null;
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  afterRender() {
    super.afterRender();
    this._renderFields();
    if (window.lucide) window.lucide.createIcons();
  }

  close() {
    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
    const container = document.getElementById('create-post-modal');
    if (container) container.innerHTML = '';
    document.body.style.overflow = '';
    if (this.onClose) this.onClose();
  }

  mount() {
    let container = document.getElementById('create-post-modal');
    if (!container) {
      container = document.createElement('div');
      container.id = 'create-post-modal';
      document.body.appendChild(container);
    }
    container.innerHTML = '';
    document.body.style.overflow = 'hidden';
    container.appendChild(this.render());
    this.afterRender();
  }
}
