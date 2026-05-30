import { Component } from './Component.js';
import { stateManager } from '../utils/state.js';
import { api } from '../utils/api.js';
import { router } from '../router.js';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/mov', 'video/quicktime'];

const POLL_MS = 2500;

export class MessagesPage extends Component {
  constructor(chatUserIdParam = null) {
    super('app');
    this.openPartnerId = chatUserIdParam ? parseInt(chatUserIdParam, 10) : null;
    this.conversations = [];
    this.activePartner = null;  // { id, username, name, avatar }
    this.messages      = [];
    this.lastMessageId = 0;
    this._pollTimer    = null;
    this._destroyed    = false;
    this._pendingMedia = null;
  }

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  render() {
    const mobile     = window.matchMedia('(max-width: 767px)').matches;
    const hasActive  = !!this.activePartner;
    const fullscreen = mobile && hasActive;

    const root = this.createElement('div', {
      className: fullscreen
        ? 'fixed inset-0 z-[10000] flex flex-col bg-slate-950 pt-[env(safe-area-inset-top,0px)]'
        : 'h-[100dvh] flex flex-col pb-16 md:pb-8 pt-[max(1rem,env(safe-area-inset-top))] md:pt-20'
    });

    const wrap = this.createElement('div', {
      className: fullscreen
        ? 'flex-1 min-h-0 flex flex-col w-full'
        : 'flex-1 min-h-0 flex flex-col max-w-7xl mx-auto px-3 md:px-6 w-full'
    });

    if (!fullscreen) {
      wrap.appendChild(this.createElement('h1', {
        className: 'text-2xl md:text-3xl font-bold mb-3'
      }, 'Messages'));
    }

    const pane = this.createElement('div', {
      className: `flex-1 min-h-0 bg-slate-800 rounded-none md:rounded-2xl flex overflow-hidden ${mobile ? '-mx-3 md:mx-0' : ''}`
    });

    if (!mobile || !hasActive) pane.appendChild(this._buildSidebar());
    if (!mobile || hasActive)  pane.appendChild(hasActive ? this._buildChat(mobile) : this._buildEmpty());

    wrap.appendChild(pane);
    root.appendChild(wrap);
    return root;
  }

  afterRender() {
    super.afterRender();
    // Load sidebar conversations (non-blocking)
    this._loadConversations();
    // If a chat is already active (after re-render), load its messages
    if (this.activePartner) {
      this._loadThread();
    }
    this._scrollToBottom();
  }

  destroy() {
    this._destroyed    = true;
    this._pendingMedia = null;
    this._stopPoll();
  }

  // ── Sidebar ─────────────────────────────────────────────────────────────────

  _buildSidebar() {
    const sidebar = this.createElement('div', {
      className: 'w-full md:w-80 border-r border-slate-700 flex flex-col min-h-0'
    });

    const searchWrap = this.createElement('div', { className: 'p-4 border-b border-slate-700' });
    const searchBox  = this.createElement('div', { className: 'relative' });
    searchBox.appendChild(this.createIcon('search', 'w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400'));
    const searchInput = this.createElement('input', {
      type: 'text', placeholder: 'Search…',
      className: 'w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-primary'
    });
    searchInput.addEventListener('input', () => this._filterConversations(searchInput.value));
    searchBox.appendChild(searchInput);
    searchWrap.appendChild(searchBox);
    sidebar.appendChild(searchWrap);

    const newBtn = this.createElement('button', {
      className: 'w-full flex items-center gap-2 px-4 py-3 text-sm text-primary hover:bg-slate-700 transition-colors border-b border-slate-700'
    });
    newBtn.appendChild(this.createIcon('edit', 'w-4 h-4'));
    newBtn.appendChild(document.createTextNode('New conversation'));
    newBtn.addEventListener('click', () => this._showUserPicker());
    sidebar.appendChild(newBtn);

    sidebar.appendChild(this.createElement('div', { id: 'conv-list', className: 'flex-1 overflow-y-auto custom-scrollbar' }));
    return sidebar;
  }

  _renderConvList(list) {
    const el = document.getElementById('conv-list');
    if (!el) return;
    el.innerHTML = '';

    if (!list.length) {
      const empty = this.createElement('div', {
        className: 'p-8 text-center text-slate-500 text-sm'
      }, 'No conversations yet. Start one above!');
      el.appendChild(empty);
      return;
    }

    list.forEach(c => {
      const name     = (c.partner_name || '').trim() || c.partner_username;
      const initials = this._initials(name);
      const isActive = this.activePartner?.id === parseInt(c.partner_id);

      const item = this.createElement('div', {
        className: `flex items-center gap-3 p-4 cursor-pointer transition-colors hover:bg-slate-700 border-l-4 ${
          isActive ? 'bg-slate-700 border-primary' : 'border-transparent'
        }`
      });
      item.addEventListener('click', () => this._openConversation({
        id:       parseInt(c.partner_id),
        username: c.partner_username,
        name,
        avatar:   c.partner_avatar,
      }));

      item.appendChild(this._avatarEl(c.partner_avatar, name, 'w-11 h-11 rounded-full'));

      const info = this.createElement('div', { className: 'flex-1 min-w-0' });
      const top  = this.createElement('div', { className: 'flex items-center justify-between' });
      top.appendChild(this.createElement('span', { className: 'font-medium text-sm truncate' }, name));
      top.appendChild(this.createElement('span', { className: 'text-xs text-slate-400 flex-shrink-0 ml-2' }, this._relTime(c.last_at)));

      const bot = this.createElement('div', { className: 'flex items-center justify-between mt-0.5' });
      const mePrefix = parseInt(c.last_sender_id) === stateManager.getState().currentUser?.id ? 'You: ' : '';
      bot.appendChild(this.createElement('p', { className: 'text-xs text-slate-400 truncate' }, mePrefix + (c.last_body || '')));
      if (parseInt(c.unread_count) > 0) {
        bot.appendChild(this.createElement('span', {
          className: 'ml-2 px-1.5 py-0.5 bg-primary text-xs font-bold rounded-full flex-shrink-0'
        }, c.unread_count.toString()));
      }

      info.appendChild(top);
      info.appendChild(bot);
      item.appendChild(info);
      el.appendChild(item);
    });
  }

  _filterConversations(q) {
    const lq = q.toLowerCase();
    this._renderConvList(lq
      ? this.conversations.filter(c =>
          (c.partner_name || '').toLowerCase().includes(lq) ||
          c.partner_username.toLowerCase().includes(lq))
      : this.conversations
    );
  }

  // ── User picker ─────────────────────────────────────────────────────────────

  async _showUserPicker() {
    try {
      const res   = await api.users.list({ limit: 50 });
      const me    = stateManager.getState().currentUser?.id;
      const users = (res?.data?.items ?? []).filter(u => u.id !== me);

      const overlay = this.createElement('div', {
        className: 'fixed inset-0 bg-black/70 z-[20000] flex items-center justify-center p-4'
      });
      const modal = this.createElement('div', {
        className: 'bg-slate-800 rounded-2xl w-full max-w-sm max-h-[80vh] flex flex-col overflow-hidden shadow-2xl'
      });

      const hdr = this.createElement('div', { className: 'flex items-center justify-between p-4 border-b border-slate-700' });
      hdr.appendChild(this.createElement('h3', { className: 'font-semibold' }, 'Start a conversation'));
      const closeBtn = this.createElement('button', { className: 'p-1 hover:bg-slate-700 rounded-lg' });
      closeBtn.appendChild(this.createIcon('x', 'w-5 h-5'));
      closeBtn.addEventListener('click', () => overlay.remove());
      hdr.appendChild(closeBtn);
      modal.appendChild(hdr);

      const list = this.createElement('div', { className: 'flex-1 overflow-y-auto' });
      users.forEach(u => {
        const name = [(u.first_name || ''), (u.last_name || '')].join(' ').trim() || u.username;
        const row  = this.createElement('div', {
          className: 'flex items-center gap-3 p-4 hover:bg-slate-700 cursor-pointer transition-colors'
        });
        row.addEventListener('click', () => {
          overlay.remove();
          this._openConversation({ id: u.id, username: u.username, name, avatar: u.profile_picture_url });
        });
        row.appendChild(this._avatarEl(u.profile_picture_url, name, 'w-10 h-10 rounded-full'));
        const info = this.createElement('div', {});
        info.appendChild(this.createElement('div', { className: 'text-sm font-medium' }, name));
        info.appendChild(this.createElement('div', { className: 'text-xs text-slate-400' }, '@' + u.username));
        row.appendChild(info);
        list.appendChild(row);
      });
      modal.appendChild(list);
      overlay.appendChild(modal);
      document.body.appendChild(overlay);
      if (window.lucide) window.lucide.createIcons();
    } catch { /* non-fatal */ }
  }

  // ── Chat pane ───────────────────────────────────────────────────────────────

  _buildEmpty() {
    const el = this.createElement('div', { className: 'flex-1 flex flex-col items-center justify-center gap-3 text-slate-500' });
    el.appendChild(this.createIcon('message-circle', 'w-16 h-16 opacity-30'));
    el.appendChild(this.createElement('p', { className: 'text-lg font-medium' }, 'Select a conversation'));
    el.appendChild(this.createElement('p', { className: 'text-sm' }, 'or start a new one above'));
    return el;
  }

  _buildChat(mobile = false) {
    const partner = this.activePartner;
    const name    = partner.name || partner.username;

    const chatWrap = this.createElement('div', { className: 'flex-1 flex flex-col min-h-0 min-w-0' });

    // Header
    const header = this.createElement('div', {
      className: 'flex items-center gap-3 p-3 md:p-4 border-b border-slate-700 flex-shrink-0'
    });
    if (mobile) {
      const back = this.createElement('button', { className: 'p-2 hover:bg-slate-700 rounded-lg' });
      back.appendChild(this.createIcon('chevron-left', 'w-5 h-5'));
      back.addEventListener('click', () => { this._stopPoll(); router.navigate('/messages'); });
      header.appendChild(back);
    }
    header.appendChild(this._avatarEl(partner.avatar, name, 'w-9 h-9 rounded-full'));
    const hInfo = this.createElement('div', { className: 'flex-1 min-w-0' });
    hInfo.appendChild(this.createElement('div', { className: 'font-semibold text-sm truncate' }, name));
    hInfo.appendChild(this.createElement('div', { className: 'text-xs text-slate-400' }, '@' + partner.username));
    header.appendChild(hInfo);
    chatWrap.appendChild(header);

    // Messages area — pre-populated with already-loaded messages
    const msgArea = this.createElement('div', {
      id: 'msg-area',
      className: 'flex-1 min-h-0 overflow-y-auto p-4 space-y-3 custom-scrollbar'
    });
    this.messages.forEach(m => msgArea.appendChild(this._buildBubble(m)));
    chatWrap.appendChild(msgArea);

    // Media preview strip (shown when a file is attached, before sending)
    const mediaPreview = this.createElement('div', {
      id: 'msg-media-preview',
      className: 'hidden flex-shrink-0 px-3 pt-2 border-t border-slate-700'
    });
    chatWrap.appendChild(mediaPreview);

    // Input
    const inputWrap = this.createElement('div', { className: 'flex-shrink-0 p-3 border-t border-slate-700 flex gap-2 items-center' });

    // Hidden file input
    const fileInput = this.createElement('input', {
      type: 'file', accept: 'image/*,video/*', id: 'msg-file-input', className: 'hidden'
    });
    fileInput.addEventListener('change', e => {
      const f = e.target.files?.[0];
      if (f) this._attachFile(f);
      fileInput.value = '';
    });
    inputWrap.appendChild(fileInput);

    // Attach button
    const attachBtn = this.createElement('button', {
      className: 'p-2.5 hover:bg-slate-700 rounded-xl transition-colors flex-shrink-0 text-slate-400 hover:text-white',
      title: 'Attach photo or video'
    });
    attachBtn.appendChild(this.createIcon('paperclip', 'w-4 h-4'));
    attachBtn.addEventListener('click', () => fileInput.click());

    const input = this.createElement('input', {
      id: 'msg-input', type: 'text', placeholder: 'Type a message…',
      className: 'flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-primary transition-colors'
    });
    input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this._send(); } });

    const sendBtn = this.createElement('button', { className: 'p-2.5 bg-primary hover:bg-primary-hover rounded-xl transition-colors flex-shrink-0' });
    sendBtn.appendChild(this.createIcon('send', 'w-4 h-4'));
    sendBtn.addEventListener('click', () => this._send());

    inputWrap.appendChild(attachBtn);
    inputWrap.appendChild(input);
    inputWrap.appendChild(sendBtn);
    chatWrap.appendChild(inputWrap);

    return chatWrap;
  }

  _buildBubble(msg) {
    const me      = stateManager.getState().currentUser;
    const isMe    = parseInt(msg.sender_id) === me?.id;
    const likeCount  = parseInt(msg.like_count ?? 0);
    const likedByMe  = msg.liked_by_me === true || msg.liked_by_me === 't' || msg.liked_by_me === '1';

    // Outer row (used as double-tap target)
    const row = this.createElement('div', {
      className: `flex flex-col ${isMe ? 'items-end' : 'items-start'} relative`
    });

    const bubbleRow = this.createElement('div', { className: `flex ${isMe ? 'justify-end' : 'justify-start'} w-full` });

    const isMediaOnly = msg.media_url && !msg.body;
    const bubbleClass = isMediaOnly
      ? `max-w-[75%] rounded-2xl overflow-hidden ${isMe ? 'rounded-br-none' : 'rounded-bl-none'}`
      : `max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
          isMe ? 'bg-primary text-white rounded-br-none' : 'bg-slate-700 text-white rounded-bl-none'
        }`;

    const bubble = this.createElement('div', { className: bubbleClass });

    // Media
    if (msg.media_url) {
      const mediaType = msg.media_type || (msg.media_url.match(/\.(mp4|webm|mov)$/i) ? 'video' : 'image');
      if (mediaType === 'video') {
        const video = this.createElement('video', {
          src:      msg.media_url,
          controls: true,
          className: 'block max-w-full rounded-2xl max-h-64 bg-black'
        });
        bubble.appendChild(video);
      } else {
        const img = this.createElement('img', {
          src:       msg.media_url,
          alt:       'Photo',
          className: 'block max-w-full rounded-2xl max-h-64 object-cover cursor-pointer'
        });
        img.addEventListener('click', e => { e.stopPropagation(); this._openLightbox(msg.media_url); });
        bubble.appendChild(img);
      }
      if (msg.body) {
        const textWrap = this.createElement('div', {
          className: `px-4 py-2 text-sm ${isMe ? 'bg-primary text-white' : 'bg-slate-700 text-white'}`
        });
        textWrap.appendChild(this.createElement('p', { className: 'leading-relaxed break-words' }, msg.body));
        bubble.appendChild(textWrap);
      }
    } else {
      bubble.appendChild(this.createElement('p', { className: 'leading-relaxed break-words' }, msg.body));
    }

    // Timestamp
    const timeEl = isMediaOnly
      ? this.createElement('div', { className: `px-3 py-1 text-xs ${isMe ? 'bg-primary text-red-200' : 'bg-slate-700 text-slate-400'}` })
      : this.createElement('p', { className: `text-xs mt-1 ${isMe ? 'text-red-200' : 'text-slate-400'}` });
    timeEl.textContent = this._relTime(msg.created_at);
    bubble.appendChild(timeEl);

    bubbleRow.appendChild(bubble);
    row.appendChild(bubbleRow);

    // Like badge (below bubble, persisted)
    const badgeRow = this.createElement('div', {
      className: `flex ${isMe ? 'justify-end' : 'justify-start'} w-full mt-0.5 px-1`
    });
    const badge = this.createElement('div', {
      className: `msg-like-badge ${likedByMe ? 'liked' : ''}`,
      id:        `like-badge-${msg.id}`,
      style:     likeCount === 0 ? 'display:none' : ''
    });
    badge.innerHTML = `<span class="heart">❤️</span><span class="count">${likeCount || ''}</span>`;
    badge.addEventListener('click', e => { e.stopPropagation(); this._toggleLike(msg.id, badge); });
    badgeRow.appendChild(badge);
    row.appendChild(badgeRow);

    // Double-tap / double-click to like
    this._attachDoubleTap(row, msg.id, badge);

    return row;
  }

  _attachDoubleTap(el, messageId, badge) {
    let lastTap = 0;
    const fire = (x, y) => {
      this._burstHeart(el, x, y);
      this._toggleLike(messageId, badge);
    };

    // Desktop double-click
    el.addEventListener('dblclick', e => {
      e.preventDefault();
      fire(e.clientX, e.clientY);
    });

    // Mobile double-tap
    el.addEventListener('touchend', e => {
      const now = Date.now();
      if (now - lastTap < 300) {
        e.preventDefault();
        const touch = e.changedTouches[0];
        fire(touch.clientX, touch.clientY);
      }
      lastTap = now;
    }, { passive: false });
  }

  _burstHeart(relEl, clientX, clientY) {
    const rect  = relEl.getBoundingClientRect();
    const heart = document.createElement('span');
    heart.className   = 'heart-burst';
    heart.textContent = '❤️';
    heart.style.left  = (clientX - rect.left - 16) + 'px';
    heart.style.top   = (clientY - rect.top  - 16) + 'px';
    relEl.style.position = 'relative';
    relEl.appendChild(heart);
    heart.addEventListener('animationend', () => heart.remove());
  }

  async _toggleLike(messageId, badge) {
    try {
      const res    = await api.messages.react(messageId);
      const liked  = res?.data?.liked;
      const count  = parseInt(res?.data?.like_count ?? 0);

      // Update local messages state
      const m = this.messages.find(x => x.id === messageId);
      if (m) { m.like_count = count; m.liked_by_me = liked; }

      // Update badge in-place
      const b = badge ?? document.getElementById(`like-badge-${messageId}`);
      if (!b) return;
      b.innerHTML = `<span class="heart">❤️</span><span class="count">${count || ''}</span>`;
      b.classList.toggle('liked', liked);
      b.style.display = count === 0 ? 'none' : '';
    } catch { /* non-fatal */ }
  }

  _openLightbox(src) {
    const overlay = document.createElement('div');
    overlay.className = 'chat-lightbox';

    const img = document.createElement('img');
    img.src = src;
    img.alt = 'Photo';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'chat-lightbox-close';
    closeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

    const close = () => {
      overlay.style.animation = 'none';
      overlay.style.opacity   = '0';
      overlay.style.transform = 'scale(0.96)';
      overlay.style.transition = 'opacity 0.15s, transform 0.15s';
      setTimeout(() => overlay.remove(), 150);
    };

    overlay.addEventListener('click', close);
    img.addEventListener('click', e => e.stopPropagation());
    closeBtn.addEventListener('click', close);
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
    });

    overlay.appendChild(img);
    overlay.appendChild(closeBtn);
    document.body.appendChild(overlay);
  }

  // ── Data loading / conversation opening ─────────────────────────────────────

  async _loadConversations() {
    try {
      const res = await api.messages.conversations();
      this.conversations = res?.data?.items ?? [];
      this._renderConvList(this.conversations);

      // Auto-open from URL param (only if no chat is active yet)
      if (this.openPartnerId && !this.activePartner) {
        const conv = this.conversations.find(c => parseInt(c.partner_id) === this.openPartnerId);
        if (conv) {
          const name = (conv.partner_name || '').trim() || conv.partner_username;
          this._openConversation({ id: parseInt(conv.partner_id), username: conv.partner_username, name, avatar: conv.partner_avatar });
        } else {
          // No history yet — fetch user info and open blank thread
          try {
            const uRes = await api.users.show(this.openPartnerId);
            const u    = uRes?.data;
            if (u) {
              const name = [(u.first_name||''), (u.last_name||'')].join(' ').trim() || u.username;
              this._openConversation({ id: u.id, username: u.username, name, avatar: u.profile_picture_url });
            }
          } catch { /* non-fatal */ }
        }
      }
    } catch { /* non-fatal */ }
  }

  _openConversation(partner) {
    this._stopPoll();
    this.activePartner = partner;
    this.messages      = [];
    this.lastMessageId = 0;
    this._pendingMedia = null;

    // Re-render the whole page with the chat pane visible
    const pc = document.getElementById('page-container');
    if (pc) {
      pc.innerHTML = '';
      pc.appendChild(this.render());
      this.afterRender();
    }
  }

  async _loadThread() {
    if (!this.activePartner) return;
    try {
      const res = await api.messages.thread(this.activePartner.id, { limit: 50 });
      this.messages      = res?.data?.items ?? [];
      this.lastMessageId = this.messages.length ? Math.max(...this.messages.map(m => m.id)) : 0;
      this._renderMessages();
      this._scrollToBottom();
      this._startPoll();
    } catch { /* non-fatal */ }
  }

  _renderMessages() {
    const area = document.getElementById('msg-area');
    if (!area) return;
    area.innerHTML = '';
    this.messages.forEach(m => area.appendChild(this._buildBubble(m)));
    if (window.lucide) window.lucide.createIcons();
  }

  // ── File attachment ─────────────────────────────────────────────────────────

  _attachFile(file) {
    const isImage = IMAGE_TYPES.includes(file.type) || file.type.startsWith('image/');
    const isVideo = VIDEO_TYPES.includes(file.type) || file.type.startsWith('video/');
    if (!isImage && !isVideo) return;

    this._pendingMedia = { file, type: isVideo ? 'video' : 'image' };

    const preview = document.getElementById('msg-media-preview');
    if (!preview) return;

    preview.innerHTML = '';
    preview.classList.remove('hidden');

    const wrap = this.createElement('div', { className: 'relative inline-block' });
    const objectUrl = URL.createObjectURL(file);

    if (isVideo) {
      const vid = this.createElement('video', {
        src:      objectUrl,
        className: 'h-24 rounded-xl object-cover bg-black',
        muted:    true,
      });
      wrap.appendChild(vid);
    } else {
      const img = this.createElement('img', {
        src:       objectUrl,
        className: 'h-24 rounded-xl object-cover',
        alt:       'Attachment preview'
      });
      wrap.appendChild(img);
    }

    // File name + size
    const meta = this.createElement('p', {
      className: 'text-xs text-slate-400 mt-1 truncate max-w-[12rem]'
    }, `${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`);

    // Remove button
    const removeBtn = this.createElement('button', {
      className: 'absolute -top-1.5 -right-1.5 bg-red-600 hover:bg-red-700 rounded-full p-0.5 transition-colors'
    });
    removeBtn.appendChild(this.createIcon('x', 'w-3 h-3'));
    removeBtn.addEventListener('click', () => {
      this._pendingMedia = null;
      preview.innerHTML = '';
      preview.classList.add('hidden');
      URL.revokeObjectURL(objectUrl);
    });
    wrap.appendChild(removeBtn);

    const container = this.createElement('div', { className: 'pb-2' });
    container.appendChild(wrap);
    container.appendChild(meta);
    preview.appendChild(container);

    if (window.lucide) window.lucide.createIcons();

    // Focus the text input
    document.getElementById('msg-input')?.focus();
  }

  async _send() {
    const input = document.getElementById('msg-input');
    const text  = input?.value?.trim() ?? '';
    const media = this._pendingMedia ?? null;

    if (!text && !media) return;
    if (!this.activePartner) return;

    input.value = '';

    // Clear media preview optimistically
    const preview = document.getElementById('msg-media-preview');
    const pendingMedia = media;
    if (media) {
      this._pendingMedia = null;
      if (preview) { preview.innerHTML = ''; preview.classList.add('hidden'); }
    }

    // Disable send button during upload
    const sendBtn = document.querySelector('#msg-area ~ div button:last-child');

    try {
      let mediaUrl  = null;
      let mediaType = null;

      if (pendingMedia) {
        const uploadRes = await api.upload(pendingMedia.file);
        mediaUrl  = uploadRes?.data?.url ?? null;
        mediaType = pendingMedia.type;
      }

      const payload = { body: text };
      if (mediaUrl) { payload.media_url = mediaUrl; payload.media_type = mediaType; }

      const res = await api.messages.send(this.activePartner.id, payload);
      const msg = res?.data;
      if (msg) {
        if (!this.messages.find(m => m.id === msg.id)) {
          this.messages.push(msg);
          if (msg.id > this.lastMessageId) this.lastMessageId = msg.id;
          const area = document.getElementById('msg-area');
          if (area) { area.appendChild(this._buildBubble(msg)); this._scrollToBottom(); }
          if (window.lucide) window.lucide.createIcons();
        }
        this._refreshConvList();
      }
    } catch { /* non-fatal */ }
  }

  // ── Polling ──────────────────────────────────────────────────────────────────

  _startPoll() {
    this._stopPoll();
    if (!this._destroyed) {
      this._pollTimer = setInterval(() => this._poll(), POLL_MS);
    }
  }

  _stopPoll() {
    if (this._pollTimer) { clearInterval(this._pollTimer); this._pollTimer = null; }
  }

  async _poll() {
    if (!this.activePartner || this._destroyed) return;
    try {
      const res  = await api.messages.poll(this.activePartner.id, this.lastMessageId);
      const msgs = res?.data?.items ?? [];
      if (!msgs.length) return;

      const area = document.getElementById('msg-area');
      let added  = false;
      msgs.forEach(m => {
        const existing = this.messages.find(x => x.id === m.id);
        if (existing) {
          // Update like state from other user's reactions
          const likeChanged = existing.like_count !== m.like_count || existing.liked_by_me !== m.liked_by_me;
          if (likeChanged) {
            existing.like_count  = m.like_count;
            existing.liked_by_me = m.liked_by_me;
            const badge = document.getElementById(`like-badge-${m.id}`);
            if (badge) {
              const count = parseInt(m.like_count ?? 0);
              const liked = m.liked_by_me === true || m.liked_by_me === 't';
              badge.innerHTML = `<span class="heart">❤️</span><span class="count">${count || ''}</span>`;
              badge.classList.toggle('liked', liked);
              badge.style.display = count === 0 ? 'none' : '';
            }
          }
          return;
        }
        this.messages.push(m);
        if (m.id > this.lastMessageId) this.lastMessageId = m.id;
        if (area) area.appendChild(this._buildBubble(m));
        added = true;
      });
      if (added) {
        this._scrollToBottom();
        if (window.lucide) window.lucide.createIcons();
        this._refreshConvList();
        const meId = stateManager.getState().currentUser?.id;
        if (meId && msgs.some((m) => Number(m.sender_id) !== Number(meId))) {
          window.dispatchEvent(new Event('artistry-notifications-updated'));
        }
      }
    } catch { /* non-fatal */ }
  }

  async _refreshConvList() {
    try {
      const res = await api.messages.conversations();
      this.conversations = res?.data?.items ?? [];
      this._renderConvList(this.conversations);
    } catch { /* non-fatal */ }
  }

  // ── Utilities ────────────────────────────────────────────────────────────────

  _avatarEl(src, name, sizeClass = 'w-10 h-10 rounded-full') {
    const av = this.createElement('div', {
      className: `${sizeClass} bg-slate-600 flex-shrink-0 flex items-center justify-center text-xs font-bold overflow-hidden`
    });
    if (src) {
      const img = this.createElement('img', { src, alt: name, className: 'w-full h-full object-cover' });
      img.addEventListener('error', () => { img.remove(); av.textContent = this._initials(name); });
      av.appendChild(img);
    } else {
      av.textContent = this._initials(name);
    }
    return av;
  }

  _initials(name) {
    return (name || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
  }

  _scrollToBottom() {
    const area = document.getElementById('msg-area');
    if (area) area.scrollTop = area.scrollHeight;
  }

  _relTime(iso) {
    if (!iso) return '';
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60)    return 'just now';
    if (diff < 3600)  return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
}
