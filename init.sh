#!/bin/bash

# ASH Development Environment Setup Script
# Sets up dependencies, runs tests, and starts the dev server in tunnel mode

set -e

echo "============================================"
echo "  ASH - Development Environment Setup"
echo "============================================"
echo ""

# Check for Node.js 20+ (required by Expo SDK 54)
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed."
    echo "Please install Node.js 20+ from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "ERROR: Node.js version 20+ is required for Expo SDK 54."
    echo "Found version $(node -v)"
    echo "Please upgrade Node.js: https://nodejs.org/"
    exit 1
fi
echo "Node.js: $(node -v)"
echo "npm: $(npm -v)"
echo ""

# Install all dependencies from package.json
echo "Installing dependencies..."
npm install

# Run tests
echo ""
echo "============================================"
echo "  Running Tests"
echo "============================================"
npm test || echo "Tests completed (some may have failed)"

echo ""
echo "============================================"
echo "  Setup Complete!"
echo "============================================"
echo ""
echo "Starting development server in tunnel mode..."
echo "Scan the QR code with Expo Go on your iOS device."
echo "Press Ctrl+C to stop the server."
echo ""

npx expo start -c --tunnel
