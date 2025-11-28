# ASH - Architectural Site History

A React Native Expo app for iOS that enables architects, contractors, and historic preservation consultants to create photo keys - visual documentation maps that show where photos were taken within a building.

## Features

- Create and manage photo keys
- Import photos from iOS camera roll with EXIF metadata extraction
- Organize photos by floor
- View photo locations on Apple Maps with directional markers
- Upload and position floor plans
- Export comprehensive PDF reports

## Tech Stack

- React Native with Expo SDK 54
- Expo Router (file-based routing)
- TypeScript with strict mode
- Zustand for state management
- react-native-maps (Apple Maps)
- @gorhom/bottom-sheet for modals

## Quick Start

Run the setup script to install dependencies, run tests, and start the dev server:

```bash
./init.sh
```

Or manually:

```bash
# Install dependencies
npm install

# Run tests
npm test

# Start dev server in tunnel mode (for Expo Go)
npm run start:tunnel
```

## Development

```bash
# Start dev server
npm start

# Start with tunnel mode (for physical device testing)
npm run start:tunnel

# Run tests
npm test

# Run tests in watch mode
npm test:watch

# Lint code
npm run lint
```

## Testing on Physical Device

1. Install [Expo Go](https://expo.dev/go) on your iOS device
2. Run `npm run start:tunnel`
3. Scan the QR code with your device camera

## Project Structure

```
app/                    # Expo Router screens
  index.tsx            # Main screen (photo keys list)
  keyview/[id].tsx     # Photo key detail view
components/            # Reusable UI components
constants/             # Theme colors, typography
hooks/                 # Custom React hooks
store/                 # Zustand state management
```

## License

Private - All rights reserved
