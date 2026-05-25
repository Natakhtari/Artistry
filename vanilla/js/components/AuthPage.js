import { Component } from './Component.js';
import { stateManager } from '../utils/state.js';
import { router } from '../router.js';
import { api } from '../utils/api.js';
import { toast } from '../utils/toast.js';

export class AuthPage extends Component {
  constructor() {
    super('app');
    this.mode = 'signin'; // signin | signup | forgot
  }

  render() {
    const container = this.createElement('div', {
      className: 'min-h-screen flex items-center justify-center px-4 py-20'
    });

    const card = this.createElement('div', {
      className: 'bg-slate-800 rounded-2xl p-8 w-full max-w-md'
    });

    // Logo
    const header = this.createElement('div', { className: 'text-center mb-8' });
    const logo = this.createElement('div', { className: 'flex items-center justify-center gap-2 mb-4' });
    logo.appendChild(this.createIcon('palette', 'w-10 h-10 text-primary'));
    logo.appendChild(this.createElement('span', { className: 'text-2xl font-bold gradient-text' }, 'Artistry'));

    const subtitleMap = {
      signin: 'Sign in to your free art portfolio',
      signup: 'Create your free, ad-free digital art portfolio',
      forgot: 'Enter your email to reset your password',
    };
    const labelMap = {
      signin: 'Sign in',
      signup: 'Create account',
      forgot: 'Reset password',
    };

    header.appendChild(logo);
    header.appendChild(this.createElement('h1', { className: 'text-2xl font-bold mb-2' }, 'Join the Artist Community'));
    header.appendChild(this.createElement('p',  { className: 'text-slate-400' }, subtitleMap[this.mode]));
    header.appendChild(this.createElement('p',  { className: 'text-sm font-semibold text-primary mt-3' }, labelMap[this.mode]));

    card.appendChild(header);
    card.appendChild(this.createForm());
    container.appendChild(card);
    return container;
  }

  createForm() {
    const form = this.createElement('form', { className: 'space-y-4' });
    form.addEventListener('submit', (e) => { e.preventDefault(); this.handleSubmit(); });

    if (this.mode === 'signup') {
      // Username
      form.appendChild(this.inputGroup('Username', 'text',     'auth-username', 'Choose a username'));
      // Email
      form.appendChild(this.inputGroup('Email',    'email',    'auth-email',    'you@example.com'));
    } else {
      // Sign-in / forgot: combined email or username field
      form.appendChild(this.inputGroup('Email or Username', 'text', 'auth-login', 'Enter your email or username'));
    }

    if (this.mode !== 'forgot') {
      form.appendChild(this.inputGroup('Password', 'password', 'auth-password',
        this.mode === 'signup' ? 'At least 8 characters' : 'Your password'));
    }

    if (this.mode === 'signup') {
      form.appendChild(this.inputGroup('Confirm Password', 'password', 'auth-confirm', 'Repeat your password'));
    }

    if (this.mode === 'signin') {
      const forgot = this.createElement('button', {
        type: 'button',
        className: 'text-sm text-primary hover:text-primary transition-colors'
      }, 'Forgot Password?');
      forgot.addEventListener('click', () => this.switchMode('forgot'));
      form.appendChild(forgot);
    }

    // Error banner (hidden by default)
    const errBanner = this.createElement('div', {
      id: 'auth-error',
      className: 'hidden text-sm text-red-400 bg-red-900/30 border border-red-800 rounded-lg px-4 py-3'
    });
    form.appendChild(errBanner);

    // Submit button
    const submitLabels = { signin: 'Sign In', signup: 'Create Account', forgot: 'Send Reset Link' };
    const submitBtn = this.createElement('button', {
      id: 'auth-submit',
      type: 'submit',
      className: 'w-full px-6 py-3 bg-primary hover:bg-primary-hover rounded-lg font-medium transition-colors flex items-center justify-center gap-2'
    }, submitLabels[this.mode]);
    form.appendChild(submitBtn);

    // Switch mode
    const switchTexts = {
      signin: ["Don't have an account? ", 'Sign Up',  'signup'],
      signup: ['Already have an account? ', 'Sign In', 'signin'],
      forgot: ['Remember your password? ',  'Sign In', 'signin'],
    };
    const [text, linkLabel, target] = switchTexts[this.mode];
    const switchRow = this.createElement('div', { className: 'text-center mt-6 text-sm' });
    const switchLink = this.createElement('button', {
      type: 'button',
      className: 'text-primary font-medium hover:underline'
    }, linkLabel);
    switchLink.addEventListener('click', () => this.switchMode(target));
    switchRow.appendChild(this.createElement('span', { className: 'text-slate-400' }, text));
    switchRow.appendChild(switchLink);
    form.appendChild(switchRow);

    return form;
  }

  inputGroup(label, type, id, placeholder) {
    const g = this.createElement('div', { className: 'space-y-2' });
    g.appendChild(this.createElement('label', { className: 'block text-sm font-medium', for: id }, label));
    g.appendChild(this.createElement('input', {
      type,
      id,
      placeholder,
      autocomplete: type === 'password' ? 'current-password' : 'off',
      className: 'w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-primary transition-colors',
    }));
    return g;
  }

  showError(msg) {
    const el = document.getElementById('auth-error');
    if (el) { el.textContent = msg; el.classList.remove('hidden'); }
  }

  hideError() {
    const el = document.getElementById('auth-error');
    if (el) el.classList.add('hidden');
  }

  setLoading(on) {
    const btn = document.getElementById('auth-submit');
    if (!btn) return;
    btn.disabled = on;
    btn.style.opacity = on ? '0.7' : '1';
    btn.style.cursor  = on ? 'not-allowed' : '';
    btn.textContent   = on ? 'Please wait…' : { signin: 'Sign In', signup: 'Create Account', forgot: 'Send Reset Link' }[this.mode];
  }

  async handleSubmit() {
    this.hideError();

    if (this.mode === 'signin') {
      await this.doLogin();
    } else if (this.mode === 'signup') {
      await this.doRegister();
    } else {
      // Forgot password — not yet backed by API
      toast.info('Password reset is not yet available in the alpha.');
      this.switchMode('signin');
    }
  }

  async doLogin() {
    const login    = document.getElementById('auth-login')?.value.trim();
    const password = document.getElementById('auth-password')?.value;

    if (!login || !password) {
      this.showError('Please fill in all fields.');
      return;
    }

    this.setLoading(true);
    try {
      const res = await api.auth.login({ login, password });
      stateManager.setToken(res.data.access_token);
      stateManager.setRefreshToken(res.data.refresh_token);
      stateManager.setUser(res.data.user);
      toast.success(`Welcome back, ${res.data.user.username}!`);
      router.navigate('/feed');
    } catch (err) {
      this.setLoading(false);
      this.showError(err.message || 'Login failed. Please try again.');
    }
  }

  async doRegister() {
    const username = document.getElementById('auth-username')?.value.trim();
    const email    = document.getElementById('auth-email')?.value.trim();
    const password = document.getElementById('auth-password')?.value;
    const confirm  = document.getElementById('auth-confirm')?.value;

    if (!username || !email || !password || !confirm) {
      this.showError('Please fill in all fields.');
      return;
    }
    if (password !== confirm) {
      this.showError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      this.showError('Password must be at least 8 characters.');
      return;
    }

    this.setLoading(true);
    try {
      const res = await api.auth.register({ username, email, password });
      stateManager.setToken(res.data.access_token);
      stateManager.setRefreshToken(res.data.refresh_token);
      stateManager.setUser(res.data.user);
      toast.success('Account created! Welcome to Artistry.');
      router.navigate('/feed');
    } catch (err) {
      this.setLoading(false);
      this.showError(err.message || 'Registration failed. Please try again.');
    }
  }

  switchMode(newMode) {
    this.mode = newMode;
    const pc = document.getElementById('page-container');
    if (pc) {
      pc.innerHTML = '';
      pc.appendChild(this.render());
      this.afterRender();
    }
  }
}
