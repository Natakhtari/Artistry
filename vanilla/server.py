#!/usr/bin/env python3
"""
Simple HTTP server for Single Page Applications (SPA)
Serves index.html for all routes that don't match actual files
"""

import http.server
import socketserver
import os
from urllib.parse import urlparse

PORT = 8093

class SPAHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Parse the URL
        url_parts = urlparse(self.path)
        path = url_parts.path
        
        # Remove leading slash
        if path.startswith('/'):
            path = path[1:]
        
        # If path is empty, serve index.html
        if not path:
            path = 'index.html'
        
        # Check if the file exists
        if os.path.exists(path) and os.path.isfile(path):
            # File exists, serve it normally
            return http.server.SimpleHTTPRequestHandler.do_GET(self)
        else:
            # File doesn't exist, check if it's a route (no file extension)
            if '.' not in path.split('/')[-1]:
                # Serve index.html for client-side routing
                self.path = '/index.html'
                return http.server.SimpleHTTPRequestHandler.do_GET(self)
            else:
                # It's a file request but file doesn't exist - return 404
                return http.server.SimpleHTTPRequestHandler.do_GET(self)

    def end_headers(self):
        # Disable caching for development
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        self.send_header('Expires', '0')
        http.server.SimpleHTTPRequestHandler.end_headers(self)

if __name__ == '__main__':
    with socketserver.TCPServer(("", PORT), SPAHTTPRequestHandler) as httpd:
        print(f"🚀 Artistry Web App running at http://localhost:{PORT}")
        print(f"📂 Serving files from: {os.getcwd()}")
        print(f"✨ SPA routing enabled - all routes serve index.html")
        print(f"🔄 Cache disabled for development")
        print(f"\n💡 Press Ctrl+C to stop the server\n")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n👋 Server stopped")

