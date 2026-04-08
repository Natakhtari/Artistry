#!/bin/bash

# Simple script to start a local server for the vanilla JS app

echo "🎨 Starting Artistry Vanilla JS Server..."
echo ""
echo "Choose a server option:"
echo "1) Python 3 (recommended)"
echo "2) PHP"
echo "3) Node.js (requires http-server: npm install -g http-server)"
echo ""
read -p "Enter your choice (1-3): " choice

cd "$(dirname "$0")"

case $choice in
  1)
    echo ""
    echo "Starting Python server on http://localhost:8000"
    echo "Press Ctrl+C to stop"
    echo ""
    python3 -m http.server 8000
    ;;
  2)
    echo ""
    echo "Starting PHP server on http://localhost:8000"
    echo "Press Ctrl+C to stop"
    echo ""
    php -S localhost:8000
    ;;
  3)
    echo ""
    echo "Starting Node.js server on http://localhost:8000"
    echo "Press Ctrl+C to stop"
    echo ""
    http-server -p 8000
    ;;
  *)
    echo "Invalid choice. Exiting."
    exit 1
    ;;
esac

