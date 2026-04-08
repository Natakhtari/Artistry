// Simple client-side router
class Router {
  constructor() {
    this.routes = {};
    this.currentRoute = '/';
    
    // Handle browser back/forward buttons
    window.addEventListener('popstate', () => {
      this.navigate(window.location.pathname, false);
    });
  }

  register(path, handler) {
    this.routes[path] = handler;
  }

  navigate(path, pushState = true) {
    console.log('Router navigate called with path:', path, 'pushState:', pushState);
    
    // Clean up the path - remove trailing slashes and query strings
    path = path.split('?')[0];
    if (path !== '/' && path.endsWith('/')) {
      path = path.slice(0, -1);
    }
    
    this.currentRoute = path;
    
    if (pushState) {
      window.history.pushState({}, '', path);
    }
    
    // Check for dynamic routes (like /user/:username)
    let handler = this.routes[path];
    
    console.log('Looking for exact match:', path, 'found:', !!handler);
    
    // If no exact match, check for dynamic routes
    if (!handler) {
      console.log('No exact match, checking dynamic routes');
      for (const route in this.routes) {
        if (route.includes(':')) {
          console.log('Checking dynamic route:', route);
          const routeParts = route.split('/');
          const pathParts = path.split('/');
          
          if (routeParts.length === pathParts.length) {
            let match = true;
            const params = {};
            
            for (let i = 0; i < routeParts.length; i++) {
              if (routeParts[i].startsWith(':')) {
                const paramName = routeParts[i].substring(1);
                params[paramName] = pathParts[i];
                console.log('Found param:', paramName, '=', pathParts[i]);
              } else if (routeParts[i] !== pathParts[i]) {
                match = false;
                break;
              }
            }
            
            if (match) {
              console.log('Dynamic route matched! Params:', params);
              handler = () => this.routes[route](params);
              break;
            }
          }
        }
      }
    }
    
    // Fallback to home if not found
    if (!handler) {
      console.warn('No handler found for path:', path, 'falling back to home');
      handler = this.routes['/'];
    }
    
    if (handler) {
      console.log('Calling handler');
      handler();
    } else {
      console.error('No route handler found for:', path);
    }
  }

  getCurrentRoute() {
    return this.currentRoute;
  }
}

export const router = new Router();

// Helper function to create links that use the router
export function createRouterLink(path, text, className = '') {
  const link = document.createElement('a');
  link.href = path;
  link.textContent = text;
  link.className = className;
  
  link.addEventListener('click', (e) => {
    e.preventDefault();
    router.navigate(path);
  });
  
  return link;
}

