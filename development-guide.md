# Voice Guardian Shield - Developer Guide

This guide provides detailed instructions for setting up and working with the Voice Guardian Shield application development environment.

## Prerequisites

### Required Tools
- **Node.js (16+)** and **npm (8+)** - For JavaScript development
- **Xcode (13+)** - For iOS development
- **CocoaPods (1.11+)** - For iOS dependency management
- **Android Studio** - For Android development (optional)

### Environment Setup

1. **Install Node.js and npm**
   - Download and install from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node -v` and `npm -v`

2. **Install Xcode (for iOS development)**
   - Download from the Mac App Store
   - Install Xcode command line tools: `xcode-select --install`
   - Open Xcode and accept license agreements

3. **Install CocoaPods**
   - Install via Ruby gem: `sudo gem install cocoapods`
   - Verify installation: `pod --version`

4. **Setup Android Studio (optional, for Android development)**
   - Download from [developer.android.com](https://developer.android.com/studio)
   - Install and follow the setup wizard
   - Configure the Android SDK

## Project Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/ArshT12/voice-guardian-shield.git
   cd voice-guardian-shield
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the web application**
   ```bash
   npm run build
   ```

4. **Setup iOS development environment**
   ```bash
   # Add iOS platform
   npx cap add ios
   
   # Install pods
   cd ios/App
   pod install
   cd ../..
   
   # Sync web code to iOS
   npx cap sync ios
   
   # Open in Xcode
   npx cap open ios
   ```

5. **Setup Android development environment (optional)**
   ```bash
   # Add Android platform
   npx cap add android
   
   # Sync web code to Android
   npx cap sync android
   
   # Open in Android Studio
   npx cap open android
   ```

## Development Workflow

### Web Development

1. **Start the development server**
   ```bash
   npm run dev
   ```
   This will start a local development server at http://localhost:5173

2. **Build for production**
   ```bash
   npm run build
   ```

### Mobile Development

After making changes to the web code:

1. **Build the web app**
   ```bash
   npm run build
   ```

2. **Sync changes to native projects**
   ```bash
   npx cap sync
   ```
   Or for specific platforms:
   ```bash
   npx cap sync ios
   npx cap sync android
   ```

3. **Open native IDEs**
   ```bash
   npx cap open ios     # Open Xcode
   npx cap open android # Open Android Studio
   ```

## Project Structure

```
voice-guardian-shield/
├── src/                   # Source code
│   ├── components/        # React components
│   ├── services/          # Core services
│   │   ├── deepfakeApi.ts       # Deepfake detection API
│   │   ├── callMonitorService.ts # Call monitoring
│   │   └── backgroundService.ts  # Background processing
│   ├── pages/             # App pages
│   ├── utils/             # Utility functions
│   └── App.tsx            # Main app component
├── public/                # Static assets
├── ios/                   # iOS platform code
├── android/               # Android platform code
├── capacitor.config.ts    # Capacitor configuration
└── package.json           # Project dependencies
```

## Core Services

### Deepfake Detection API (`src/services/deepfakeApi.ts`)
Handles communication with the Hugging Face AI model for voice analysis.

### Call Monitor Service (`src/services/callMonitorService.ts`)
Manages phone call detection and audio stream capture.

### Background Service (`src/services/backgroundService.ts`)
Enables the app to run in the background and continue monitoring.

## Configuration Files

### capacitor.config.ts
This file configures the Capacitor project settings:

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.voice.guardian.shield',
  appName: 'Voice Guardian Shield',
  webDir: 'dist',
  server: {
    cleartext: true
  },
  ios: {
    minVersion: '14.0'  // Required for background-runner
  },
  plugins: {
    BackgroundRunner: {
      label: 'com.voiceguardian.monitoring',
      src: 'background.js',
      event: 'start',
      autoStart: true,
      ios: {
        cpuLimitInSeconds: 600  // 10 min (maximum allowed on iOS)
      }
    },
    Permissions: {
      phone: true,
      microphone: true,
      notifications: true
    }
  }
};

export default config;
```

### Podfile (ios/App/Podfile)
The Podfile configuration for iOS:

```ruby
platform :ios, '14.0'
use_frameworks!

def capacitor_pods
  pod 'Capacitor', :path => '../../node_modules/@capacitor/ios'
  pod 'CapacitorCordova', :path => '../../node_modules/@capacitor/ios'
end

target 'App' do
  project 'App.xcodeproj'
  capacitor_pods
  pod 'CapacitorBackgroundRunner', :path => '../../node_modules/@capacitor/background-runner'
  # Add your Pods here
end
```

## Common Issues and Solutions

### iOS Build Issues

1. **Signing Issues**
   - In Xcode, select the App project
   - Go to Signing & Capabilities
   - Check "Automatically manage signing"
   - Select your personal team

2. **Dependency Version Conflicts**
   - Ensure Capacitor packages have compatible versions
   - iOS platform requires Capacitor 7.0.0+ for the background-runner plugin

3. **Pod Installation Failures**
   - Ensure CocoaPods is up to date: `sudo gem install cocoapods`
   - Try cleaning the cache: `pod cache clean --all`
   - Delete Pods directory and Podfile.lock, then run `pod install` again

### macOS Development Issues

1. **Hidden Files**
   - Remove macOS metadata files: `find . -name "._*" -type f -delete`
   - Remove .DS_Store files: `find . -name ".DS_Store" -type f -delete`

2. **Permission Issues**
   - Ensure proper permissions for microphone access in Info.plist
   - Request permissions at runtime

## Testing the App

1. **Using the Simulator**
   - Test call monitoring using simulated calls
   - Use the demo mode for testing deepfake detection

2. **Using Physical Devices**
   - Required for full testing of phone functionality
   - Ensure proper provisioning profiles are set up in Xcode

## Additional Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [React Documentation](https://react.dev/reference/react)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
