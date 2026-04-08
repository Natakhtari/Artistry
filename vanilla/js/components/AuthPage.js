import { Component } from './Component.js';
import { stateManager } from '../utils/state.js';
import { router } from '../router.js';

export class AuthPage extends Component {
  constructor() {
    super('app');
    this.mode = 'signin'; // signin, signup, forgot
  }

  render() {
    const container = this.createElement('div', {
      className: 'min-h-screen flex items-center justify-center px-4 py-20'
    });

    const card = this.createElement('div', {
      className: 'bg-slate-800 rounded-2xl p-8 w-full max-w-md'
    });

    // Logo & Title
    const header = this.createElement('div', {
      className: 'text-center mb-8'
    });

    const logo = this.createElement('div', {
      className: 'flex items-center justify-center gap-2 mb-4'
    });

    const logoIcon = this.createIcon('palette', 'w-10 h-10 text-primary');
    const logoText = this.createElement('span', {
      className: 'text-2xl font-bold gradient-text'
    }, 'Artistry');

    logo.appendChild(logoIcon);
    logo.appendChild(logoText);

    const title = this.createElement('h1', {
      className: 'text-2xl font-bold mb-2'
    }, this.mode === 'signin' ? 'Welcome Back' : this.mode === 'signup' ? 'Create Account' : 'Reset Password');

    const subtitle = this.createElement('p', {
      className: 'text-slate-400'
    }, this.mode === 'signin' ? 'Sign in to continue' : this.mode === 'signup' ? 'Join the creative community' : 'Enter your email to reset');

    header.appendChild(logo);
    header.appendChild(title);
    header.appendChild(subtitle);

    // Form
    const form = this.createForm();

    card.appendChild(header);
    card.appendChild(form);
    container.appendChild(card);

    return container;
  }

  createForm() {
    const form = this.createElement('form', {
      className: 'space-y-4'
    });
    
    // Add submit handler using addEventListener (not React's onsubmit)
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      console.log('Form submitted!');
      this.handleSubmit();
    });

    // Email
    const emailGroup = this.createElement('div', {
      className: 'space-y-2'
    });

    const emailLabel = this.createElement('label', {
      className: 'block text-sm font-medium'
    }, 'Email or Username');

    const emailInput = this.createElement('input', {
      type: 'text',
      id: 'auth-email',
      className: 'w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-primary transition-colors',
      placeholder: this.mode === 'forgot' ? 'Enter your email' : 'admin',
      required: true
    });

    emailGroup.appendChild(emailLabel);
    emailGroup.appendChild(emailInput);
    form.appendChild(emailGroup);

    // Password (not for forgot password)
    if (this.mode !== 'forgot') {
      const passwordGroup = this.createElement('div', {
        className: 'space-y-2'
      });

      const passwordLabel = this.createElement('label', {
        className: 'block text-sm font-medium'
      }, 'Password');

      const passwordInput = this.createElement('input', {
        type: 'password',
        id: 'auth-password',
        className: 'w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-primary transition-colors',
        placeholder: this.mode === 'signin' ? 'admin' : 'Create a password',
        required: true
      });

      passwordGroup.appendChild(passwordLabel);
      passwordGroup.appendChild(passwordInput);
      form.appendChild(passwordGroup);
    }

    // Confirm Password (signup only)
    if (this.mode === 'signup') {
      const confirmGroup = this.createElement('div', {
        className: 'space-y-2'
      });

      const confirmLabel = this.createElement('label', {
        className: 'block text-sm font-medium'
      }, 'Confirm Password');

      const confirmInput = this.createElement('input', {
        type: 'password',
        id: 'auth-confirm',
        className: 'w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-primary transition-colors',
        placeholder: 'Confirm your password',
        required: true
      });

      confirmGroup.appendChild(confirmLabel);
      confirmGroup.appendChild(confirmInput);
      form.appendChild(confirmGroup);
    }

    // Forgot Password Link (signin only)
    if (this.mode === 'signin') {
      const forgotLink = this.createElement('button', {
        type: 'button',
        className: 'text-sm text-primary hover:text-primary transition-colors'
      }, 'Forgot Password?');
      
      forgotLink.addEventListener('click', () => this.switchMode('forgot'));

      form.appendChild(forgotLink);
    }

    // Submit Button
    const submitBtn = this.createElement('button', {
      type: 'submit',
      className: 'w-full px-6 py-3 bg-primary hover:bg-primary-hover rounded-lg font-medium transition-colors'
    }, this.mode === 'signin' ? 'Sign In' : this.mode === 'signup' ? 'Create Account' : 'Send Reset Link');

    form.appendChild(submitBtn);

    // Demo credentials hint (signin only)
    if (this.mode === 'signin') {
      const hint = this.createElement('p', {
        className: 'text-xs text-center text-slate-500 mt-4 p-3 bg-slate-900 rounded-lg'
      }, '💡 Demo: admin / admin');

      form.appendChild(hint);
    }

    // Switch Mode Link
    const switchContainer = this.createElement('div', {
      className: 'text-center mt-6 text-sm'
    });

    const switchText = this.createElement('span', {
      className: 'text-slate-400'
    }, this.mode === 'signin' ? "Don't have an account? " : this.mode === 'signup' ? "Already have an account? " : "Remember your password? ");

    const switchLink = this.createElement('button', {
      type: 'button',
      className: 'text-primary hover:text-primary font-medium transition-colors'
    }, this.mode === 'signin' ? 'Sign Up' : 'Sign In');
    
    switchLink.addEventListener('click', () => this.switchMode(this.mode === 'signin' ? 'signup' : 'signin'));

    switchContainer.appendChild(switchText);
    switchContainer.appendChild(switchLink);
    form.appendChild(switchContainer);

    return form;
  }

  handleSubmit() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password')?.value;

    if (this.mode === 'signin') {
      // Check credentials
      if (email === 'admin' && password === 'admin') {
        // Login successful
        console.log('Login successful!');
        stateManager.setState({ isAuthenticated: true });
        
        // Small delay to ensure state is updated
        setTimeout(() => {
          console.log('Navigating to /feed');
          router.navigate('/feed', true);
        }, 100);
      } else {
        alert('Invalid credentials! Use admin/admin');
      }
    } else if (this.mode === 'signup') {
      const confirm = document.getElementById('auth-confirm').value;
      if (password !== confirm) {
        alert('Passwords do not match!');
        return;
      }
      // Create account (mock)
      alert('Account created! You can now sign in.');
      this.switchMode('signin');
    } else if (this.mode === 'forgot') {
      alert(`Password reset link sent to ${email}!`);
      this.switchMode('signin');
    }
  }

  switchMode(newMode) {
    this.mode = newMode;
    const pageContainer = document.getElementById('page-container');
    if (pageContainer) {
      pageContainer.innerHTML = '';
      const newElement = this.render();
      pageContainer.appendChild(newElement);
      this.afterRender();
    }
  }
}

