// Test file to verify routing
console.log('=== ROUTING TEST ===');

// Test the router
import { router } from './router.js';

// Log all registered routes
setTimeout(() => {
  console.log('Registered routes:', Object.keys(router.routes));
  
  // Test dynamic route matching
  const testPath = '/user/elena-rodriguez';
  console.log('Testing path:', testPath);
  
  // Check if route exists
  for (const route in router.routes) {
    console.log('Checking route:', route);
    if (route.includes(':')) {
      const routeParts = route.split('/');
      const pathParts = testPath.split('/');
      console.log('Route parts:', routeParts, 'Path parts:', pathParts);
    }
  }
}, 1000);

