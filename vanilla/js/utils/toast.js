// In-app toast notifications — replaces all alert() and confirm() calls

const STYLES = {
  success: { border: '#16a34a', icon: '✓' },
  error:   { border: '#ef4444', icon: '✕' },
  info:    { border: '#3b82f6', icon: 'ℹ' },
  warning: { border: '#f59e0b', icon: '⚠' },
};

let container = null;
let injected = false;

function injectStyles() {
  if (injected) return;
  injected = true;
  const s = document.createElement('style');
  s.textContent = `
    @keyframes _toast_in  { from { opacity:0; transform:translateX(1.5rem); } to { opacity:1; transform:translateX(0); } }
    @keyframes _toast_out { from { opacity:1; transform:translateX(0);      } to { opacity:0; transform:translateX(1.5rem); } }
    @keyframes _dialog_in { from { opacity:0; transform:scale(.96); } to { opacity:1; transform:scale(1); } }
  `;
  document.head.appendChild(s);
}

function getContainer() {
  if (!container || !document.body.contains(container)) {
    container = document.createElement('div');
    Object.assign(container.style, {
      position: 'fixed',
      bottom: '5.5rem',
      right: '1.25rem',
      zIndex: '99999',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      pointerEvents: 'none',
      maxWidth: '22rem',
      width: 'calc(100vw - 2.5rem)',
    });
    document.body.appendChild(container);
  }
  return container;
}

function show(message, type = 'info', duration = 3500) {
  injectStyles();
  const cfg = STYLES[type] || STYLES.info;
  const c = getContainer();

  const toast = document.createElement('div');
  Object.assign(toast.style, {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.65rem',
    padding: '0.7rem 1rem',
    background: '#1e293b',
    border: `1px solid ${cfg.border}`,
    borderLeft: `4px solid ${cfg.border}`,
    borderRadius: '0.6rem',
    color: '#f1f5f9',
    fontSize: '0.875rem',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    lineHeight: '1.4',
    boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
    pointerEvents: 'auto',
    cursor: 'pointer',
    animation: '_toast_in 0.25s ease forwards',
  });

  const icon = document.createElement('span');
  Object.assign(icon.style, {
    color: cfg.border,
    fontWeight: 'bold',
    fontSize: '0.9rem',
    flexShrink: '0',
    marginTop: '0.05rem',
  });
  icon.textContent = cfg.icon;

  const text = document.createElement('span');
  text.textContent = message;

  toast.appendChild(icon);
  toast.appendChild(text);
  c.appendChild(toast);

  const dismiss = () => {
    toast.style.animation = '_toast_out 0.25s ease forwards';
    setTimeout(() => toast.remove(), 260);
  };

  toast.addEventListener('click', dismiss);
  const t = setTimeout(dismiss, duration);
  toast._t = t;

  return { dismiss: () => { clearTimeout(t); dismiss(); } };
}

/**
 * Shows a styled confirmation dialog.
 * Returns a Promise<boolean>.
 */
function confirm(message, { confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = true } = {}) {
  injectStyles();
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    Object.assign(overlay.style, {
      position: 'fixed',
      inset: '0',
      background: 'rgba(0,0,0,0.65)',
      zIndex: '99998',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
    });

    const dialog = document.createElement('div');
    Object.assign(dialog.style, {
      background: '#1e293b',
      border: '1px solid #334155',
      borderRadius: '1rem',
      padding: '1.75rem',
      maxWidth: '26rem',
      width: '100%',
      boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
      animation: '_dialog_in 0.2s ease forwards',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    });

    const msg = document.createElement('p');
    Object.assign(msg.style, {
      color: '#f1f5f9',
      fontSize: '1rem',
      lineHeight: '1.55',
      marginBottom: '1.5rem',
    });
    msg.textContent = message;

    const btnRow = document.createElement('div');
    Object.assign(btnRow.style, {
      display: 'flex',
      gap: '0.75rem',
      justifyContent: 'flex-end',
    });

    const makeBtn = (label, bg, hoverBg) => {
      const btn = document.createElement('button');
      btn.textContent = label;
      Object.assign(btn.style, {
        padding: '0.55rem 1.25rem',
        background: bg,
        color: '#f1f5f9',
        border: 'none',
        borderRadius: '0.5rem',
        cursor: 'pointer',
        fontSize: '0.9rem',
        fontFamily: 'inherit',
        transition: 'background 0.15s',
      });
      btn.onmouseenter = () => { btn.style.background = hoverBg; };
      btn.onmouseleave = () => { btn.style.background = bg; };
      return btn;
    };

    const cancelBtn  = makeBtn(cancelLabel, '#334155', '#475569');
    const confirmBtn = makeBtn(confirmLabel, danger ? '#dc2626' : '#2563eb', danger ? '#b91c1c' : '#1d4ed8');

    const close = (result) => {
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.15s';
      setTimeout(() => overlay.remove(), 150);
      resolve(result);
    };

    cancelBtn.addEventListener('click',  () => close(false));
    confirmBtn.addEventListener('click', () => close(true));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(false); });

    btnRow.appendChild(cancelBtn);
    btnRow.appendChild(confirmBtn);
    dialog.appendChild(msg);
    dialog.appendChild(btnRow);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
  });
}

export const toast = {
  success: (msg, dur) => show(msg, 'success', dur),
  error:   (msg, dur) => show(msg, 'error',   dur),
  info:    (msg, dur) => show(msg, 'info',     dur),
  warning: (msg, dur) => show(msg, 'warning',  dur),
  confirm,
};
