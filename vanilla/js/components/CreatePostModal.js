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
      className:
        'bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-x-hidden overflow-y-auto cpm-modal-scroll'
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
    this._videoFile    = null;   // processed video Blob
    this._videoRawFile = null;   // original selected File
    this._videoFilter  = 'none';
    this._videoStart   = 0;
    this._videoEnd     = null;   // null = full duration

    const wrap = this.createElement('div', { className: 'space-y-4' });

    // ── Source toggle ──────────────────────────────────────────────────────
    const toggle = this.createElement('div', {
      className: 'flex rounded-lg overflow-hidden border border-slate-700'
    });
    const urlTab  = this.createElement('button', {
      id:        'vid-tab-url',
      className: 'flex-1 py-2 text-sm transition-colors bg-primary text-white font-medium'
    }, 'URL');
    const fileTab = this.createElement('button', {
      id:        'vid-tab-file',
      className: 'flex-1 py-2 text-sm transition-colors bg-slate-700 text-slate-300 hover:bg-slate-600'
    }, 'Upload file');

    const urlSection  = this.createElement('div', { id: 'vid-url-section' });
    const fileSection = this.createElement('div', { id: 'vid-file-section', className: 'hidden' });

    urlTab.addEventListener('click', () => {
      urlTab.className  = 'flex-1 py-2 text-sm transition-colors bg-primary text-white font-medium';
      fileTab.className = 'flex-1 py-2 text-sm transition-colors bg-slate-700 text-slate-300 hover:bg-slate-600';
      urlSection.classList.remove('hidden');
      fileSection.classList.add('hidden');
      this._videoFile = null;
    });
    fileTab.addEventListener('click', () => {
      fileTab.className = 'flex-1 py-2 text-sm transition-colors bg-primary text-white font-medium';
      urlTab.className  = 'flex-1 py-2 text-sm transition-colors bg-slate-700 text-slate-300 hover:bg-slate-600';
      fileSection.classList.remove('hidden');
      urlSection.classList.add('hidden');
    });

    toggle.appendChild(urlTab);
    toggle.appendChild(fileTab);
    wrap.appendChild(toggle);

    // URL section
    urlSection.appendChild(this._buildInput('Video URL', 'https://youtube.com/watch?v=… or direct .mp4 link', 'cpm-media-url', false));
    wrap.appendChild(urlSection);

    // File upload section
    fileSection.appendChild(this._buildVideoUploader());
    wrap.appendChild(fileSection);

    wrap.appendChild(this._buildInput('Thumbnail URL (optional)', 'https://…', 'cpm-thumb-url', false));
    wrap.appendChild(this._buildInput('Title *', 'Give your video a title…', 'cpm-title', true));
    wrap.appendChild(this._buildTextarea('Description', 'What is this video about?', 'cpm-desc'));
    return wrap;
  }

  _buildVideoUploader() {
    const wrap = this.createElement('div', { className: 'space-y-2' });

    const dropArea = this.createElement('div', {
      id:        'vid-drop-area',
      className: 'border-2 border-dashed border-slate-700 rounded-lg p-8 text-center hover:border-slate-500 transition-colors cursor-pointer'
    });
    dropArea.appendChild(this.createIcon('video', 'w-10 h-10 mx-auto mb-3 text-slate-500'));
    dropArea.appendChild(this.createElement('p', { className: 'text-slate-400 mb-1' }, 'Click to upload or drag and drop'));
    dropArea.appendChild(this.createElement('p', { className: 'text-sm text-slate-500' }, 'MP4, WebM, MOV — max 500 MB'));

    const fileInput = this.createElement('input', {
      type: 'file', accept: 'video/*', className: 'hidden', id: 'vid-file-input'
    });
    fileInput.addEventListener('change', e => { const f = e.target.files?.[0]; if (f) this._openVideoEditor(f); });
    dropArea.addEventListener('click', () => fileInput.click());
    dropArea.addEventListener('dragover', e => { e.preventDefault(); dropArea.classList.add('border-primary'); });
    dropArea.addEventListener('dragleave', () => dropArea.classList.remove('border-primary'));
    dropArea.addEventListener('drop', e => {
      e.preventDefault(); dropArea.classList.remove('border-primary');
      const f = e.dataTransfer?.files?.[0];
      if (f && f.type.startsWith('video/')) this._openVideoEditor(f);
    });
    dropArea.appendChild(fileInput);
    wrap.appendChild(dropArea);

    wrap.appendChild(this.createElement('div', { id: 'vid-editor-area', className: 'hidden' }));
    return wrap;
  }

  _openVideoEditor(file) {
    this._videoRawFile = file;
    this._videoFile    = null;
    this._videoFilter  = 'none';
    this._videoStart   = 0;
    this._videoEnd     = null;

    const dropArea  = document.getElementById('vid-drop-area');
    const editorArea = document.getElementById('vid-editor-area');
    if (dropArea) dropArea.classList.add('hidden');
    if (!editorArea) return;

    editorArea.classList.remove('hidden');
    editorArea.innerHTML = '';

    const url = URL.createObjectURL(file);
    const editor = this.createElement('div', {
      className: 'bg-slate-900 rounded-xl overflow-hidden border border-slate-700'
    });

    // Header
    const hdr = this.createElement('div', {
      className: 'flex items-center justify-between px-4 py-3 border-b border-slate-700'
    });
    hdr.appendChild(this.createElement('span', { className: 'text-sm font-semibold' }, 'Edit Video'));
    const changeBtn = this.createElement('button', {
      className: 'text-xs text-slate-400 hover:text-white px-3 py-1 hover:bg-slate-700 rounded-lg transition-colors'
    }, 'Change file');
    changeBtn.addEventListener('click', () => {
      URL.revokeObjectURL(url);
      editorArea.classList.add('hidden');
      editorArea.innerHTML = '';
      dropArea?.classList.remove('hidden');
      const fi = document.getElementById('vid-file-input');
      if (fi) fi.value = '';
      this._videoFile = null; this._videoRawFile = null;
    });
    hdr.appendChild(changeBtn);
    editor.appendChild(hdr);

    // Video preview
    const videoWrap = this.createElement('div', {
      className: 'relative bg-black flex items-center justify-center'
    });
    const video = this.createElement('video', {
      id:       'vid-preview',
      src:      url,
      className: 'max-h-56 w-full object-contain',
      preload:  'metadata',
      controls: true,
    });
    video.style.filter = 'none';
    videoWrap.appendChild(video);
    editor.appendChild(videoWrap);

    // Filters
    const filterBar = this.createElement('div', {
      className: 'flex gap-2 px-4 py-3 border-b border-slate-700 overflow-x-auto'
    });
    filterBar.appendChild(this.createElement('span', { className: 'text-xs text-slate-400 flex-shrink-0 self-center' }, 'Filter:'));
    const filters = [
      { label: 'None',       id: 'none',      css: 'none' },
      { label: 'Warm',       id: 'warm',      css: 'sepia(0.4) saturate(1.5) brightness(1.05)' },
      { label: 'Cool',       id: 'cool',      css: 'saturate(0.8) hue-rotate(20deg) brightness(1.1)' },
      { label: 'Dramatic',   id: 'dramatic',  css: 'contrast(1.4) saturate(1.2) brightness(0.9)' },
      { label: 'Vintage',    id: 'vintage',   css: 'sepia(0.7) contrast(1.1) brightness(0.95)' },
      { label: 'B&W',        id: 'bw',        css: 'grayscale(1) contrast(1.1)' },
      { label: 'Vivid',      id: 'vivid',     css: 'saturate(2) brightness(1.05) contrast(1.1)' },
    ];
    filters.forEach((f, i) => {
      const btn = this.createElement('button', {
        'data-filter-id': f.id,
        className: `text-xs px-3 py-1 rounded-full flex-shrink-0 transition-colors ${
          i === 0 ? 'bg-primary text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
        }`
      }, f.label);
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-filter-id]').forEach(b => {
          b.className = 'text-xs px-3 py-1 rounded-full flex-shrink-0 transition-colors bg-slate-700 hover:bg-slate-600 text-slate-300';
        });
        btn.className = 'text-xs px-3 py-1 rounded-full flex-shrink-0 transition-colors bg-primary text-white';
        this._videoFilter = f.id;
        video.style.filter = f.css;
      });
      filterBar.appendChild(btn);
    });
    editor.appendChild(filterBar);

    // Trim sliders
    const trimBar = this.createElement('div', {
      className: 'px-4 py-3 border-b border-slate-700 space-y-3'
    });
    trimBar.appendChild(this.createElement('p', { className: 'text-xs text-slate-400 font-medium' }, 'Trim'));

    const startRow = this.createElement('div', { className: 'flex items-center gap-3' });
    startRow.appendChild(this.createElement('span', { className: 'text-xs text-slate-400 w-12 flex-shrink-0' }, 'Start'));
    const startSlider = this.createElement('input', {
      type: 'range', min: '0', step: '0.1', value: '0',
      id: 'vid-start-slider',
      className: 'flex-1 accent-primary'
    });
    const startLabel = this.createElement('span', { id: 'vid-start-label', className: 'text-xs text-slate-300 w-12 text-right' }, '0:00');
    startRow.appendChild(startSlider);
    startRow.appendChild(startLabel);

    const endRow = this.createElement('div', { className: 'flex items-center gap-3' });
    endRow.appendChild(this.createElement('span', { className: 'text-xs text-slate-400 w-12 flex-shrink-0' }, 'End'));
    const endSlider = this.createElement('input', {
      type: 'range', min: '0', step: '0.1', value: '100',
      id: 'vid-end-slider',
      className: 'flex-1 accent-primary'
    });
    const endLabel = this.createElement('span', { id: 'vid-end-label', className: 'text-xs text-slate-300 w-12 text-right' }, '—:——');

    endRow.appendChild(endSlider);
    endRow.appendChild(endLabel);
    trimBar.appendChild(startRow);
    trimBar.appendChild(endRow);
    editor.appendChild(trimBar);

    // Wire sliders when metadata loaded
    video.addEventListener('loadedmetadata', () => {
      const dur = video.duration;
      this._videoEnd = dur;
      startSlider.max = dur.toFixed(1);
      endSlider.max   = dur.toFixed(1);
      endSlider.value = dur.toFixed(1);
      endLabel.textContent = this._fmtTime(dur);

      startSlider.addEventListener('input', () => {
        const v = parseFloat(startSlider.value);
        this._videoStart = v;
        startLabel.textContent = this._fmtTime(v);
        if (v >= this._videoEnd) { startSlider.value = (this._videoEnd - 0.1).toFixed(1); }
        video.currentTime = v;
      });
      endSlider.addEventListener('input', () => {
        const v = parseFloat(endSlider.value);
        this._videoEnd = v;
        endLabel.textContent = this._fmtTime(v);
        if (v <= this._videoStart) { endSlider.value = (this._videoStart + 0.1).toFixed(1); }
      });
    });

    // Actions
    const actionRow = this.createElement('div', { className: 'flex gap-3 p-3 items-center' });
    const statusEl  = this.createElement('span', {
      id: 'vid-process-status',
      className: 'text-xs text-slate-400 flex-1'
    }, '');

    const skipBtn = this.createElement('button', {
      className: 'px-3 py-2 text-sm bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors'
    }, 'Use original');
    skipBtn.addEventListener('click', () => {
      this._videoFile = file;
      this._showVideoReady(file.name, url, editor);
    });

    const applyBtn = this.createElement('button', {
      id:        'vid-apply-btn',
      className: 'px-4 py-2 text-sm bg-primary hover:bg-primary-hover rounded-lg transition-colors font-medium flex items-center gap-2'
    });
    applyBtn.appendChild(this.createIcon('scissors', 'w-4 h-4'));
    applyBtn.appendChild(document.createTextNode('Apply edits'));
    applyBtn.addEventListener('click', () => this._applyVideoEdits(video, file, url, filters, statusEl, applyBtn, skipBtn));

    actionRow.appendChild(statusEl);
    actionRow.appendChild(skipBtn);
    actionRow.appendChild(applyBtn);
    editor.appendChild(actionRow);

    editorArea.appendChild(editor);
    if (window.lucide) window.lucide.createIcons();
  }

  _fmtTime(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  async _applyVideoEdits(videoEl, origFile, url, filterDefs, statusEl, applyBtn, skipBtn) {
    const start  = this._videoStart ?? 0;
    const end    = this._videoEnd ?? videoEl.duration;
    const filterId = this._videoFilter ?? 'none';
    const filterDef = filterDefs.find(f => f.id === filterId) ?? filterDefs[0];

    // No edits — use original
    if (filterId === 'none' && start === 0 && Math.abs(end - videoEl.duration) < 0.2) {
      this._videoFile = origFile;
      this._showVideoReady(origFile.name, url, applyBtn.closest('.bg-slate-900'));
      return;
    }

    if (!window.MediaRecorder) {
      statusEl.textContent = 'MediaRecorder not supported — using original.';
      this._videoFile = origFile;
      this._showVideoReady(origFile.name, url, applyBtn.closest('.bg-slate-900'));
      return;
    }

    applyBtn.disabled  = true;
    skipBtn.disabled   = true;
    applyBtn.innerHTML = '';
    applyBtn.appendChild(this.createIcon('loader', 'w-4 h-4 animate-spin'));
    applyBtn.appendChild(document.createTextNode(' Processing…'));
    statusEl.textContent = 'Setting up…';

    try {
      const blob = await this._recordTrimmedVideo(videoEl, start, end, filterDef.css, (progress) => {
        statusEl.textContent = `Processing… ${Math.round(progress * 100)}%`;
      });

      const ext   = 'webm';
      const fname = (origFile.name.replace(/\.[^.]+$/, '') || 'video') + `-edited.${ext}`;
      this._videoFile = new File([blob], fname, { type: blob.type });
      const previewUrl = URL.createObjectURL(blob);
      this._showVideoReady(fname, previewUrl, applyBtn.closest('.bg-slate-900'));
    } catch (err) {
      statusEl.textContent = 'Processing failed — using original.';
      this._videoFile = origFile;
      this._showVideoReady(origFile.name, url, applyBtn.closest('.bg-slate-900'));
    }

    if (window.lucide) window.lucide.createIcons();
  }

  _recordTrimmedVideo(videoEl, start, end, cssFilter, onProgress) {
    return new Promise((resolve, reject) => {
      const duration = end - start;
      const canvas   = document.createElement('canvas');
      canvas.width   = videoEl.videoWidth  || 640;
      canvas.height  = videoEl.videoHeight || 360;
      const ctx      = canvas.getContext('2d');

      // Get audio from the video element's stream
      let sourceStream;
      try { sourceStream = videoEl.captureStream(); } catch { sourceStream = null; }
      const audioTracks = sourceStream?.getAudioTracks() ?? [];

      const canvasStream    = canvas.captureStream(30);
      const combinedTracks  = [...canvasStream.getVideoTracks(), ...audioTracks];
      const combined        = new MediaStream(combinedTracks);

      // Choose best available codec
      const mimeTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
      ];
      const mimeType = mimeTypes.find(m => MediaRecorder.isTypeSupported(m)) || '';
      const recorder = new MediaRecorder(combined, mimeType ? { mimeType } : {});

      const chunks = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onerror = err => reject(err);
      recorder.onstop  = () => {
        resolve(new Blob(chunks, { type: mimeType || 'video/webm' }));
      };

      videoEl.muted       = false;
      videoEl.currentTime = start;

      let rafId;
      const drawLoop = () => {
        if (videoEl.currentTime >= end || videoEl.ended) {
          recorder.stop();
          cancelAnimationFrame(rafId);
          return;
        }
        if (cssFilter && cssFilter !== 'none') {
          ctx.filter = cssFilter;
        } else {
          ctx.filter = 'none';
        }
        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
        onProgress?.((videoEl.currentTime - start) / duration);
        rafId = requestAnimationFrame(drawLoop);
      };

      videoEl.onseeked = () => {
        recorder.start(100); // collect chunks every 100ms
        videoEl.play().then(() => {
          drawLoop();
          // Safety stop after duration + 1s buffer
          setTimeout(() => {
            if (recorder.state === 'recording') {
              cancelAnimationFrame(rafId);
              recorder.stop();
            }
          }, (duration + 1) * 1000);
        }).catch(reject);
        videoEl.onseeked = null;
      };

      videoEl.currentTime = start; // trigger onseeked
    });
  }

  _showVideoReady(filename, previewUrl, editorEl) {
    if (!editorEl) return;
    editorEl.innerHTML = '';

    const readyWrap = this.createElement('div', {
      className: 'bg-slate-900 rounded-xl overflow-hidden border border-slate-700 p-4 space-y-3'
    });

    const vidPreview = this.createElement('video', {
      src:      previewUrl,
      className: 'w-full rounded-lg max-h-48 object-contain bg-black',
      controls: true,
    });
    readyWrap.appendChild(vidPreview);
    readyWrap.appendChild(this.createElement('p', {
      className: 'text-xs text-slate-400 truncate'
    }, filename));

    const btnRow = this.createElement('div', { className: 'flex gap-2' });
    const reEditBtn = this.createElement('button', {
      className: 'flex-1 py-2 text-sm bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors'
    }, 'Re-edit');
    reEditBtn.addEventListener('click', () => {
      if (this._videoRawFile) this._openVideoEditor(this._videoRawFile);
    });
    const checkEl = this.createElement('div', {
      className: 'flex items-center gap-1.5 text-green-400 text-sm'
    });
    checkEl.appendChild(this.createIcon('check-circle', 'w-4 h-4'));
    checkEl.appendChild(document.createTextNode('Ready to publish'));
    btnRow.appendChild(reEditBtn);
    btnRow.appendChild(checkEl);
    readyWrap.appendChild(btnRow);

    editorEl.appendChild(readyWrap);
    if (window.lucide) window.lucide.createIcons();
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
    if (file) this._openEditor(file);
  }

  /** Drop handler also goes through the editor */
  _applyFile(file) { this._openEditor(file); }

  // ── Image editor (Cropper.js) ─────────────────────────────────────────────

  _openEditor(file) {
    this._destroyCropper();
    this._pendingFile = file;
    const url = URL.createObjectURL(file);
    this._pendingUrl = url;

    const uploadArea = document.getElementById('cpm-upload-area');
    const preview    = document.getElementById('cpm-preview');
    if (uploadArea) uploadArea.classList.add('hidden');
    if (preview) {
      preview.classList.remove('hidden');
      preview.classList.add('overflow-visible');
      preview.innerHTML = '';
    }

    // ── editor panel ──────────────────────────────────────────────────────
    const editor = this.createElement('div', {
      id: 'cpm-editor',
      className: 'bg-slate-900 rounded-xl border border-slate-700 overflow-visible'
    });

    // header
    const editorHeader = this.createElement('div', {
      className: 'flex items-center justify-between px-4 py-3 border-b border-slate-700'
    });
    editorHeader.appendChild(this.createElement('span', {
      className: 'text-sm font-semibold text-slate-200'
    }, 'Edit Photo'));

    // skip button
    const skipBtn = this.createElement('button', {
      type: 'button',
      className: 'text-xs text-slate-400 hover:text-white transition-colors px-3 py-1 rounded-lg hover:bg-slate-700'
    }, 'Skip editing');
    skipBtn.addEventListener('click', () => this._skipEditing());
    editorHeader.appendChild(skipBtn);
    editor.appendChild(editorHeader);

    // cropper canvas area
    const canvasWrap = this.createElement('div', {
      className: 'relative bg-black flex items-center justify-center cpm-cropper-wrap',
      style: { maxHeight: 'min(55vh, 420px)', minHeight: '240px', width: '100%' }
    });
    const img = document.createElement('img');
    img.id = 'cpm-crop-img';
    img.alt = '';
    img.src = url;
    // Cropper.js requires max-width: none on the image (100% breaks the crop box).
    img.style.display = 'block';
    img.style.maxWidth = 'none';
    img.style.width = '100%';
    img.style.height = 'auto';
    img.style.maxHeight = 'min(55vh, 420px)';
    canvasWrap.appendChild(img);
    editor.appendChild(canvasWrap);

    // aspect-ratio bar
    const ratioBar = this.createElement('div', {
      className: 'flex items-center gap-2 px-4 py-2 border-b border-slate-700 overflow-x-auto'
    });
    ratioBar.appendChild(this.createElement('span', {
      className: 'text-xs text-slate-400 flex-shrink-0'
    }, 'Aspect:'));
    const ratios = [
      { label: 'Free', val: NaN },
      { label: '1:1',  val: 1 },
      { label: '3:4',  val: 3/4 },
      { label: '4:3',  val: 4/3 },
      { label: '16:9', val: 16/9 },
    ];
    ratios.forEach(({ label, val }, i) => {
      const rb = this.createElement('button', {
        type: 'button',
        'data-ratio': label,
        className: `text-xs px-3 py-1 rounded-full flex-shrink-0 transition-colors ${
          i === 0 ? 'bg-primary text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
        }`
      }, label);
      rb.addEventListener('click', () => {
        ratioBar.querySelectorAll('[data-ratio]').forEach((b) => {
          b.className =
            'text-xs px-3 py-1 rounded-full flex-shrink-0 transition-colors bg-slate-700 hover:bg-slate-600 text-slate-300';
        });
        rb.className = 'text-xs px-3 py-1 rounded-full flex-shrink-0 transition-colors bg-primary text-white';
        if (this._cropper) this._cropper.setAspectRatio(Number.isFinite(val) ? val : NaN);
      });
      ratioBar.appendChild(rb);
    });
    editor.appendChild(ratioBar);

    // toolbar
    const toolbar = this.createElement('div', {
      className: 'flex items-center gap-1 flex-wrap px-3 py-2 border-b border-slate-700'
    });
    const toolBtnClass = 'flex flex-col items-center gap-0.5 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors text-xs';

    const tools = [
      { icon: 'rotate-ccw',         label: 'Rotate L',  action: () => this._cropper?.rotate(-90) },
      { icon: 'rotate-cw',          label: 'Rotate R',  action: () => this._cropper?.rotate(90)  },
      { icon: 'flip-horizontal-2',  label: 'Flip H',    action: () => this._cropper?.scaleX(-(this._scaleX = -(this._scaleX||1))) },
      { icon: 'flip-vertical-2',    label: 'Flip V',    action: () => this._cropper?.scaleY(-(this._scaleY = -(this._scaleY||1))) },
      { icon: 'zoom-in',            label: 'Zoom In',   action: () => this._cropper?.zoom(0.1)   },
      { icon: 'zoom-out',           label: 'Zoom Out',  action: () => this._cropper?.zoom(-0.1)  },
      { icon: 'maximize-2',         label: 'Fit',       action: () => this._cropper?.reset()     },
    ];
    tools.forEach(({ icon, label, action }) => {
      const btn = this.createElement('button', { type: 'button', className: toolBtnClass });
      btn.appendChild(this.createIcon(icon, 'w-4 h-4'));
      btn.appendChild(document.createTextNode(label));
      btn.addEventListener('click', action);
      toolbar.appendChild(btn);
    });
    editor.appendChild(toolbar);

    // apply / cancel row
    const actionRow = this.createElement('div', {
      className: 'flex gap-3 p-3 justify-end'
    });

    const cancelBtn = this.createElement('button', {
      type: 'button',
      className: 'px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors'
    }, 'Cancel');
    cancelBtn.addEventListener('click', () => this._cancelEditor());

    const applyBtn = this.createElement('button', {
      id:        'cpm-apply-crop-btn',
      type:      'button',
      className: 'px-4 py-2 text-sm bg-primary hover:bg-primary-hover rounded-lg transition-colors font-medium flex items-center gap-2'
    });
    applyBtn.appendChild(this.createIcon('check', 'w-4 h-4'));
    applyBtn.appendChild(document.createTextNode('Apply Crop'));
    applyBtn.addEventListener('click', () => this._applyCrop());

    actionRow.appendChild(cancelBtn);
    actionRow.appendChild(applyBtn);
    editor.appendChild(actionRow);

    if (preview) preview.appendChild(editor);

    const bootCropper = () => {
      if (!document.body.contains(img) || this._cropper) return;
      this._scaleX = 1;
      this._scaleY = 1;
      if (typeof window.Cropper !== 'function') {
        toast.show('Image editor failed to load. Check your network and refresh.', 'error');
        return;
      }
      try {
        this._cropper = new window.Cropper(img, {
          viewMode:     1,
          dragMode:     'move',
          autoCropArea: 0.85,
          responsive:   true,
          background:   true,
          checkOrientation: true,
        });
      } catch (err) {
        console.error(err);
        toast.show('Could not start crop tool for this image.', 'error');
      }
      if (window.lucide) window.lucide.createIcons();
    };

    if (img.complete && img.naturalWidth > 0) {
      requestAnimationFrame(bootCropper);
    } else {
      img.addEventListener('load', () => requestAnimationFrame(bootCropper), { once: true });
      img.addEventListener(
        'error',
        () => {
          toast.show('Could not read this image file.', 'error');
          this._cancelEditor();
        },
        { once: true }
      );
    }
  }

  _destroyCropper() {
    if (this._cropper) { this._cropper.destroy(); this._cropper = null; }
    if (this._pendingUrl) { URL.revokeObjectURL(this._pendingUrl); this._pendingUrl = null; }
  }

  _cancelEditor() {
    this._destroyCropper();
    this._pendingFile = null;
    const uploadArea = document.getElementById('cpm-upload-area');
    const preview    = document.getElementById('cpm-preview');
    const fileInput  = document.getElementById('cpm-file-input');
    if (uploadArea) uploadArea.classList.remove('hidden');
    if (preview) {
      preview.classList.add('hidden');
      preview.classList.remove('overflow-visible');
      preview.innerHTML = '';
    }
    if (fileInput)  fileInput.value = '';
  }

  _skipEditing() {
    const file = this._pendingFile;
    this._destroyCropper();
    this._commitFile(file, URL.createObjectURL(file));
  }

  _applyCrop() {
    const applyBtn = document.getElementById('cpm-apply-crop-btn');
    const restoreApplyBtn = () => {
      if (!applyBtn) return;
      applyBtn.disabled = false;
      applyBtn.replaceChildren();
      applyBtn.appendChild(this.createIcon('check', 'w-4 h-4'));
      applyBtn.appendChild(document.createTextNode('Apply Crop'));
      if (window.lucide) window.lucide.createIcons();
    };

    if (!this._cropper) {
      toast.show('Crop tool is not ready yet.', 'error');
      return;
    }

    if (applyBtn) {
      applyBtn.disabled = true;
      applyBtn.replaceChildren(document.createTextNode('Applying…'));
    }

    let canvas;
    try {
      canvas = this._cropper.getCroppedCanvas({
        maxWidth: 2048,
        maxHeight: 2048,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
      });
    } catch (err) {
      console.error(err);
      toast.show('Could not read the cropped image.', 'error');
      restoreApplyBtn();
      return;
    }

    if (!canvas || typeof canvas.toBlob !== 'function') {
      toast.show('Could not read the cropped image.', 'error');
      restoreApplyBtn();
      return;
    }

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          toast.show('Could not create image file.', 'error');
          restoreApplyBtn();
          return;
        }
        const file = new File([blob], this._pendingFile?.name || 'photo.jpg', { type: 'image/jpeg' });
        const newUrl = URL.createObjectURL(blob);
        this._destroyCropper();
        this._commitFile(file, newUrl);
      },
      'image/jpeg',
      0.92
    );
  }

  _commitFile(file, url) {
    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
    this.uploadedFile = file;
    this.previewUrl   = url;
    this._showPreview(url, file.name);
  }

  _showPreview(url, name) {
    const uploadArea = document.getElementById('cpm-upload-area');
    const preview    = document.getElementById('cpm-preview');
    if (!uploadArea || !preview) return;

    uploadArea.classList.add('hidden');
    preview.classList.remove('hidden');
    preview.classList.remove('overflow-visible');
    preview.innerHTML = '';

    const wrap = this.createElement('div', { className: 'relative' });

    const img = this.createElement('img', {
      src:       url,
      alt:       name,
      className: 'w-full h-56 object-cover rounded-lg',
    });
    wrap.appendChild(img);

    wrap.appendChild(this.createElement('p', {
      className: 'text-xs text-slate-400 mt-1 truncate'
    }, name));

    // re-edit button
    const editBtn = this.createElement('button', {
      className: 'absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-black/60 hover:bg-black/80 rounded-lg text-xs transition-colors'
    });
    editBtn.appendChild(this.createIcon('crop', 'w-3 h-3'));
    editBtn.appendChild(document.createTextNode('Edit'));
    editBtn.addEventListener('click', () => {
      if (this.uploadedFile) this._openEditor(this.uploadedFile);
    });
    wrap.appendChild(editBtn);

    const removeBtn = this.createElement('button', {
      className: 'absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-700 rounded-full transition-colors'
    });
    removeBtn.appendChild(this.createIcon('x', 'w-4 h-4'));
    removeBtn.addEventListener('click', () => this._removeFile());
    wrap.appendChild(removeBtn);

    preview.appendChild(wrap);
    if (window.lucide) window.lucide.createIcons();
  }

  _removeFile() {
    this._destroyCropper();
    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
    this.uploadedFile = null;
    this.previewUrl   = null;
    this._pendingFile = null;

    const uploadArea = document.getElementById('cpm-upload-area');
    const preview    = document.getElementById('cpm-preview');
    const fileInput  = document.getElementById('cpm-file-input');
    if (uploadArea) uploadArea.classList.remove('hidden');
    if (preview) {
      preview.classList.add('hidden');
      preview.classList.remove('overflow-visible');
      preview.innerHTML = '';
    }
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
        : this.selectedType === 'video'
          ? 'Please upload a video file or enter a video URL.'
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
    if (this.selectedType === 'video' && this._videoFile) {
      const uploadRes = await api.upload(this._videoFile);
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
