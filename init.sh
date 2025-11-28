#!/bin/bash

# ASH Development Environment Setup Script
# Sets up dependencies, runs tests, and starts the dev server in tunnel mode

set -e

echo "============================================"
echo "  ASH - Development Environment Setup"
echo "============================================"
echo ""

# Check for Node.js 18+
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed."
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "ERROR: Node.js version 18+ is required. Found version $(node -v)"
    exit 1
fi
echo "Node.js: $(node -v)"
echo "npm: $(npm -v)"
echo ""

# Install dependencies
echo "Installing dependencies..."
npm install

# Install additional required packages for ASH
echo ""
echo "Installing ASH-specific packages..."
npx expo install \
    zustand \
    @react-native-async-storage/async-storage \
    react-native-maps \
    expo-image-picker \
    expo-file-system \
    expo-media-library \
    expo-print \
    @gorhom/bottom-sheet \
    react-native-svg \
    @expo-google-fonts/josefin-sans

# Install Jest and testing dependencies
echo ""
echo "Installing Jest testing dependencies..."
npm install --save-dev \
    jest \
    @testing-library/react-native \
    @testing-library/jest-native \
    jest-expo \
    @types/jest

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
