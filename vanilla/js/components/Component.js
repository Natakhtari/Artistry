// Component base class
export class Component {
  constructor(containerId) {
    this.containerId = containerId;
    this.element = null;
  }

  render() {
    throw new Error('render() must be implemented by subclass');
  }

  mount() {
    const container = document.getElementById(this.containerId) || document.getElementById('app');
    if (container) {
      container.innerHTML = '';
      const element = this.render();
      container.appendChild(element);
      this.element = element;
      this.afterRender();
    }
  }

  afterRender() {
    // Hook for post-render logic (event listeners, etc.)
    // Initialize Lucide icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  createElement(tag, attributes = {}, ...children) {
    const element = document.createElement(tag);
    
    // Set attributes
    Object.keys(attributes).forEach(key => {
      if (key === 'className') {
        element.className = attributes[key];
      } else if (key.startsWith('on') && key !== 'onerror' && key !== 'onload' && key !== 'onkeypress') {
        // Skip onClick, onChange, etc. - these should be added with addEventListener
        console.warn(`Warning: Use addEventListener instead of ${key} attribute`);
      } else if (key === 'style' && typeof attributes[key] === 'object') {
        Object.assign(element.style, attributes[key]);
      } else {
        element.setAttribute(key, attributes[key]);
      }
    });
    
    // Append children
    children.forEach(child => {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else if (child instanceof Node) {
        element.appendChild(child);
      } else if (Array.isArray(child)) {
        child.forEach(c => {
          if (c instanceof Node) element.appendChild(c);
        });
      }
    });
    
    return element;
  }

  createIcon(iconName, className = 'w-5 h-5') {
    const icon = document.createElement('i');
    icon.setAttribute('data-lucide', iconName);
    icon.className = className;
    return icon;
  }
}

