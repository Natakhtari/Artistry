import { Component } from './Component.js';
import { avatars } from '../utils/avatars.js';
import { router } from '../router.js';

export class MessagesPage extends Component {
  constructor(chatIdParam = null) {
    super('app');
    this.chatIdParam =
      chatIdParam != null && String(chatIdParam).trim() !== ''
        ? String(chatIdParam)
        : null;
    this.conversations = this.generateConversations();
    this.selectedChat = this.resolveSelectedChat(this.chatIdParam);
    console.log('MessagesPage constructed, conversations:', this.conversations);
  }

  resolveSelectedChat(chatIdParam) {
    if (!chatIdParam || !/^\d+$/.test(chatIdParam)) return null;
    const id = parseInt(chatIdParam, 10);
    return this.conversations.find((c) => c.id === id) || null;
  }

  isMobileViewport() {
    return typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
  }

  generateConversations() {
    return [
      {
        id: 1,
        user: 'Elena Rodriguez',
        avatar: avatars.elenaRodriguez,
        lastMessage: 'Thanks for the feedback on my artwork!',
        time: '2 min ago',
        unread: 2,
        online: true
      },
      {
        id: 2,
        user: 'Marcus Chen',
        avatar: avatars.marcusChen,
        lastMessage: 'Would love to collaborate on a project',
        time: '1 hour ago',
        unread: 0,
        online: true
      },
      {
        id: 3,
        user: 'Sophia Laurent',
        avatar: avatars.sophiaLaurent,
        lastMessage: 'Check out my new gallery opening!',
        time: '3 hours ago',
        unread: 1,
        online: false
      },
      {
        id: 4,
        user: 'Alex Kim',
        avatar: avatars.alexKim,
        lastMessage: 'The exhibition was amazing',
        time: '1 day ago',
        unread: 0,
        online: false
      },
      {
        id: 5,
        user: 'Yuki Tanaka',
        avatar: avatars.yukiTanaka,
        lastMessage: 'See you at the art fair!',
        time: '2 days ago',
        unread: 0,
        online: true
      }
    ];
  }

  render() {
    console.log('MessagesPage render called');
    const mobile = this.isMobileViewport();
    const showList = !mobile || !this.selectedChat;
    const showChatPane = !mobile || !!this.selectedChat;
    const fullscreen = !!this.selectedChat;

    // Open conversation: fixed full-screen layer above nav (immersive chat)
    const container = this.createElement('div', {
      className: fullscreen
        ? 'fixed inset-0 z-[10000] flex flex-col overflow-hidden bg-slate-950 pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]'
        : 'h-[100dvh] box-border flex flex-col overflow-hidden pb-16 md:pb-8 pt-[max(1rem,env(safe-area-inset-top))] md:pt-20'
    });

    const contentContainer = this.createElement('div', {
      className: fullscreen
        ? 'flex-1 min-h-0 flex flex-col w-full min-w-0'
        : 'flex-1 min-h-0 flex flex-col max-w-7xl mx-auto px-3 md:px-6 w-full'
    });

    // Header only on list / empty state (not over full-screen chat)
    const header = this.createElement('div', {
      className: mobile && this.selectedChat ? 'hidden' : 'mb-2 md:mb-3'
    });

    const title = this.createElement('h1', {
      className: 'text-2xl md:text-3xl font-bold'
    }, 'Messages');

    header.appendChild(title);

    if (mobile && !this.selectedChat) {
      const hint = this.createElement('p', {
        className: 'text-sm text-slate-400 mt-1'
      }, 'Tap a conversation to open the chat.');
      header.appendChild(hint);
    }

    const chatContainer = this.createElement('div', {
      className: fullscreen
        ? 'flex-1 min-h-0 min-w-0 bg-slate-800 overflow-hidden flex flex-col md:flex-row w-full'
        : `flex-1 min-h-0 bg-slate-800 overflow-hidden flex flex-col md:flex-row ${
            mobile ? 'rounded-none md:rounded-2xl -mx-3 md:mx-0' : 'rounded-2xl'
          }`
    });

    if (showList) {
      chatContainer.appendChild(this.createSidebar());
    }

    if (showChatPane) {
      const chatArea = this.selectedChat
        ? this.createChatArea(this.selectedChat, mobile)
        : this.createEmptyState();
      chatContainer.appendChild(chatArea);
    }

    if (!fullscreen) {
      contentContainer.appendChild(header);
    }
    contentContainer.appendChild(chatContainer);
    container.appendChild(contentContainer);

    return container;
  }

  getSeoContext() {
    if (this.selectedChat?.user) {
      return { chatWith: this.selectedChat.user };
    }
    return {};
  }

  afterRender() {
    if (this.chatIdParam != null && !this.selectedChat) {
      router.navigate('/messages', true);
      return;
    }
    if (this.selectedChat) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    const messagesArea = document.getElementById('messages-area');
    if (messagesArea) {
      messagesArea.scrollTop = messagesArea.scrollHeight;
    }
  }

  createSidebar() {
    const sidebar = this.createElement('div', {
      className:
        'w-full md:w-80 border-r border-slate-700 flex flex-col min-h-0 flex-1 md:flex-initial md:min-h-0'
    });

    // Search
    const searchContainer = this.createElement('div', {
      className: 'p-4 border-b border-slate-700'
    });

    const searchWrapper = this.createElement('div', {
      className: 'relative'
    });

    const searchIcon = this.createIcon('search', 'w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400');

    const searchInput = this.createElement('input', {
      type: 'text',
      placeholder: 'Search messages...',
      className: 'w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-primary transition-colors'
    });

    searchWrapper.appendChild(searchIcon);
    searchWrapper.appendChild(searchInput);
    searchContainer.appendChild(searchWrapper);

    // Conversations List
    const list = this.createElement('div', {
      className: 'flex-1 overflow-y-auto custom-scrollbar'
    });

    this.conversations.forEach(conv => {
      const item = this.createConversationItem(conv);
      list.appendChild(item);
    });

    sidebar.appendChild(searchContainer);
    sidebar.appendChild(list);

    return sidebar;
  }

  createConversationItem(conv) {
    const isSelected = this.selectedChat?.id === conv.id;

    const item = this.createElement('div', {
      className: `flex items-center gap-3 p-4 hover:bg-slate-700 cursor-pointer transition-colors ${
        isSelected ? 'bg-slate-700 border-l-4 border-primary' : 'border-l-4 border-transparent'
      }`
    });
    item.addEventListener('click', () => this.selectChat(conv));

    // Avatar with online status
    const avatarContainer = this.createElement('div', {
      className: 'relative flex-shrink-0'
    });

    const avatar = this.createElement('div', {
      className: 'w-12 h-12 rounded-full overflow-hidden bg-slate-700'
    });

    const avatarImg = this.createElement('img', {
      src: conv.avatar,
      alt: `Avatar of ${conv.user}, Artistry message thread`,
      className: 'w-full h-full object-cover'
    });

    avatar.appendChild(avatarImg);

    if (conv.online) {
      const onlineIndicator = this.createElement('div', {
        className: 'absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-800'
      });
      avatarContainer.appendChild(onlineIndicator);
    }

    avatarContainer.appendChild(avatar);

    // Info
    const info = this.createElement('div', {
      className: 'flex-1 min-w-0'
    });

    const nameRow = this.createElement('div', {
      className: 'flex items-center justify-between mb-1'
    });

    const name = this.createElement('span', {
      className: 'font-medium truncate'
    }, conv.user);

    const time = this.createElement('span', {
      className: 'text-xs text-slate-400'
    }, conv.time);

    nameRow.appendChild(name);
    nameRow.appendChild(time);

    const messageRow = this.createElement('div', {
      className: 'flex items-center justify-between'
    });

    const lastMessage = this.createElement('p', {
      className: 'text-sm text-slate-400 truncate'
    }, conv.lastMessage);

    messageRow.appendChild(lastMessage);

    if (conv.unread > 0) {
      const unreadBadge = this.createElement('span', {
        className: 'ml-2 px-2 py-0.5 bg-primary text-xs font-bold rounded-full flex-shrink-0'
      }, conv.unread.toString());
      messageRow.appendChild(unreadBadge);
    }

    info.appendChild(nameRow);
    info.appendChild(messageRow);

    item.appendChild(avatarContainer);
    item.appendChild(info);

    return item;
  }

  selectChat(conv) {
    if (this.isMobileViewport()) {
      router.navigate(`/messages/${conv.id}`);
      return;
    }
    this.selectedChat = conv;

    const pageContainer = document.getElementById('page-container');
    if (pageContainer) {
      pageContainer.innerHTML = '';
      const newElement = this.render();
      pageContainer.appendChild(newElement);
      this.afterRender();
    }
  }

  createChatArea(chat, mobile = false) {
    const chatArea = this.createElement('div', {
      className: 'flex-1 flex flex-col min-h-0 min-w-0 overflow-x-hidden'
    });

    // Chat Header
    const chatHeader = this.createElement('div', {
      className:
        'p-3 md:p-4 border-b border-slate-700 flex items-center justify-between gap-2 flex-shrink-0 min-w-0 overflow-hidden'
    });

    const headerLeft = this.createElement('div', {
      className: 'flex items-center gap-1 md:gap-3 min-w-0 flex-1'
    });

    if (mobile) {
      const backBtn = this.createElement('button', {
        type: 'button',
        className:
          'p-2 -ml-1 hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0',
        'aria-label': 'Back to conversations'
      });
      const backIcon = this.createIcon('chevron-left', 'w-6 h-6');
      backBtn.appendChild(backIcon);
      backBtn.addEventListener('click', () => router.navigate('/messages'));
      headerLeft.appendChild(backBtn);
    }

    const userInfo = this.createElement('div', {
      className: 'flex items-center gap-3 min-w-0 flex-1'
    });

    const avatar = this.createElement('div', {
      className: 'w-10 h-10 rounded-full overflow-hidden bg-slate-700 flex-shrink-0'
    });

    const avatarImg = this.createElement('img', {
      src: chat.avatar,
      alt: `Profile photo of ${chat.user}, active Artistry chat`,
      className: 'w-full h-full object-cover'
    });

    avatar.appendChild(avatarImg);

    const nameStatus = this.createElement('div', {
      className: 'min-w-0 flex-1'
    });
    const name = this.createElement('div', {
      className: mobile ? 'font-medium truncate' : 'font-medium'
    }, chat.user);

    const status = this.createElement('div', {
      className: 'text-sm text-slate-400'
    }, chat.online ? 'Online' : 'Offline');

    nameStatus.appendChild(name);
    nameStatus.appendChild(status);
    userInfo.appendChild(avatar);
    userInfo.appendChild(nameStatus);

    headerLeft.appendChild(userInfo);

    const actions = this.createElement('div', {
      className: 'flex gap-1 md:gap-2 flex-shrink-0'
    });

    const videoBtn = this.createElement('button', {
      className: 'p-2 hover:bg-slate-700 rounded-lg transition-colors'
    });
    const videoIcon = this.createIcon('video', 'w-5 h-5');
    videoBtn.appendChild(videoIcon);

    const phoneBtn = this.createElement('button', {
      className: 'p-2 hover:bg-slate-700 rounded-lg transition-colors'
    });
    const phoneIcon = this.createIcon('phone', 'w-5 h-5');
    phoneBtn.appendChild(phoneIcon);

    const moreBtn = this.createElement('button', {
      className: 'p-2 hover:bg-slate-700 rounded-lg transition-colors'
    });
    const moreIcon = this.createIcon('more-vertical', 'w-5 h-5');
    moreBtn.appendChild(moreIcon);

    actions.appendChild(videoBtn);
    actions.appendChild(phoneBtn);
    actions.appendChild(moreBtn);

    chatHeader.appendChild(headerLeft);
    if (!mobile) {
      chatHeader.appendChild(actions);
    }

    // Messages Area — sole vertical scroll region in chat
    const messagesArea = this.createElement('div', {
      className: 'flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-4 custom-scrollbar',
      id: 'messages-area'
    });

    // Sample messages
    const messages = this.generateMessages(chat);
    messages.forEach(msg => {
      const msgElement = this.createMessage(msg);
      messagesArea.appendChild(msgElement);
    });

    // Input Area — pinned below messages; does not scroll with thread
    const inputArea = this.createElement('div', {
      className: 'flex-shrink-0 p-2 sm:p-4 border-t border-slate-700 min-w-0 overflow-hidden'
    });

    const inputContainer = this.createElement('div', {
      className: 'flex items-stretch gap-1 sm:gap-2 min-w-0 w-full max-w-full'
    });

    const attachBtn = this.createElement('button', {
      type: 'button',
      className:
        'p-2 sm:p-3 hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0 touch-manipulation',
      'aria-label': 'Attach file'
    });
    const attachIcon = this.createIcon('paperclip', 'w-5 h-5');
    attachBtn.appendChild(attachIcon);

    const input = this.createElement('input', {
      type: 'text',
      placeholder: 'Type a message...',
      className:
        'flex-1 min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-primary transition-colors text-sm sm:text-base',
      id: 'message-input'
    });
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendMessage();
    });

    const emojiBtn = this.createElement('button', {
      type: 'button',
      className:
        'p-2 sm:p-3 hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0 touch-manipulation',
      'aria-label': 'Emoji'
    });
    const emojiIcon = this.createIcon('smile', 'w-5 h-5');
    emojiBtn.appendChild(emojiIcon);

    const sendBtn = this.createElement('button', {
      type: 'button',
      className: mobile
        ? 'p-2.5 sm:p-3 bg-primary hover:bg-primary-hover rounded-lg transition-colors flex-shrink-0 flex items-center justify-center touch-manipulation'
        : 'px-6 py-3 bg-primary hover:bg-primary-hover rounded-lg transition-colors font-medium flex-shrink-0'
    });
    if (mobile) {
      sendBtn.appendChild(this.createIcon('send', 'w-5 h-5'));
      sendBtn.setAttribute('aria-label', 'Send');
    } else {
      sendBtn.appendChild(document.createTextNode('Send'));
    }
    sendBtn.addEventListener('click', () => this.sendMessage());

    inputContainer.appendChild(attachBtn);
    inputContainer.appendChild(input);
    inputContainer.appendChild(emojiBtn);
    inputContainer.appendChild(sendBtn);
    inputArea.appendChild(inputContainer);

    chatArea.appendChild(chatHeader);
    chatArea.appendChild(messagesArea);
    chatArea.appendChild(inputArea);

    return chatArea;
  }

  generateMessages(chat) {
    return [
      { id: 1, from: 'them', text: 'Hey! I saw your latest artwork, it\'s amazing!', time: '10:30 AM' },
      { id: 2, from: 'me', text: 'Thank you so much! I really appreciate it 😊', time: '10:32 AM' },
      { id: 3, from: 'them', text: chat.lastMessage, time: '10:35 AM' },
      { id: 4, from: 'me', text: 'Absolutely! Would love to work together.', time: '10:36 AM' }
    ];
  }

  createMessage(msg) {
    const isMe = msg.from === 'me';

    const messageDiv = this.createElement('div', {
      className: `flex ${isMe ? 'justify-end' : 'justify-start'}`
    });

    const bubble = this.createElement('div', {
      className: `max-w-[85%] sm:max-w-md px-4 py-3 rounded-2xl ${
        isMe
          ? 'bg-primary text-white rounded-br-none'
          : 'bg-slate-700 text-white rounded-bl-none'
      }`
    });

    const text = this.createElement('p', {}, msg.text);
    const time = this.createElement('p', {
      className: `text-xs mt-1 ${isMe ? 'text-blue-200' : 'text-slate-400'}`
    }, msg.time);

    bubble.appendChild(text);
    bubble.appendChild(time);
    messageDiv.appendChild(bubble);

    return messageDiv;
  }

  sendMessage() {
    const input = document.getElementById('message-input');
    if (!input || !input.value.trim()) return;

    const messagesArea = document.getElementById('messages-area');
    if (!messagesArea) return;

    const newMessage = {
      id: Date.now(),
      from: 'me',
      text: input.value,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };

    const msgElement = this.createMessage(newMessage);
    messagesArea.appendChild(msgElement);

    // Scroll to bottom
    messagesArea.scrollTop = messagesArea.scrollHeight;

    // Clear input
    input.value = '';

    // Re-initialize icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  createEmptyState() {
    const emptyState = this.createElement('div', {
      className: 'flex-1 min-h-0 flex items-center justify-center p-6 overflow-hidden'
    });

    const content = this.createElement('div', {
      className: 'text-center max-w-sm'
    });

    const icon = this.createIcon('message-circle', 'w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 text-slate-600');
    const title = this.createElement('h3', {
      className: 'text-xl md:text-2xl font-bold mb-2'
    }, 'Select a conversation');

    const subtitle = this.createElement('p', {
      className: 'text-slate-400 text-sm md:text-base'
    }, 'Choose a conversation from the list to start messaging.');

    content.appendChild(icon);
    content.appendChild(title);
    content.appendChild(subtitle);
    emptyState.appendChild(content);

    return emptyState;
  }
}
