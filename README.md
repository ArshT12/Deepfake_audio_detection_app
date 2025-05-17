
# Voice Guardian Shield - React Native App

This is a React Native version of the Voice Guardian Shield application, designed to detect deepfake voices in phone calls.

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- React Native CLI
- Xcode (for iOS development)
- Android Studio (for Android development)

### Installation

1. Clone this repository
```bash
git clone https://github.com/your-username/voice-guardian-shield.git
cd voice-guardian-shield
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Start the Metro bundler
```bash
npm start
# or
yarn start
```

4. Run on Android or iOS
```bash
npm run android
# or
npm run ios
```

## Features

- Real-time deepfake voice detection
- Call monitoring integration
- Audio recording and analysis
- Settings customization
- Detection history

## Project Structure

- `/src` - Source code
  - `/components` - Reusable UI components
  - `/contexts` - React contexts for state management
  - `/native` - Native module bridges
  - `/pages` - Application screens
  - `/services` - API and utility services
  - `/types` - TypeScript type definitions

## Native Modules

### CallMonitorModule

This module interacts with the native phone APIs to monitor calls and analyze voice data for deepfake detection.

#### Android Implementation

Located in `android/app/src/main/java/com/voiceguardianshield/CallMonitorModule.java`

#### iOS Implementation

Located in `ios/VoiceGuardianShield/CallMonitorModule.swift`

## License

This project is licensed under the MIT License - see the LICENSE file for details.
