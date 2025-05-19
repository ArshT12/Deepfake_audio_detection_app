
# Voice Guardian Shield

Voice Guardian Shield is a mobile application designed to protect users from deepfake voice scams by analyzing voice calls in real-time and alerting users when a deepfake voice is detected.

## Table of Contents

1. [Core Features](#core-features)
2. [How It Works](#how-it-works)
3. [Technical Architecture](#technical-architecture)
4. [Services](#services)
5. [Usage Guide](#usage-guide)
6. [Setup & Development](#setup--development)

## Core Features

- **Real-time Call Monitoring**: Analyzes ongoing calls for deepfake voices
- **Manual Audio Analysis**: Upload or record audio for deepfake detection
- **Call Demo**: Test the deepfake detection with simulated calls
- **Detection History**: View and manage your past detection records
- **Configurable Settings**: Customize detection thresholds and behaviors

## How It Works

Voice Guardian Shield uses advanced audio analysis to detect synthetic or AI-generated voices that might indicate a scam attempt:

1. **Call Monitoring**: When enabled, the app uses your device's microphone to analyze the audio from incoming and outgoing calls. This happens locally on your device for privacy.

2. **Deepfake Detection**: The app analyzes audio samples using our AI model to determine if the voice is authentic or synthetic. The analysis generates a confidence score.

3. **Alert System**: If a deepfake is detected, you'll receive immediate alerts based on your settings.

4. **Protective Actions**: You can configure the app to automatically end calls when a deepfake is detected, providing an extra layer of protection.

## Technical Architecture

The application is built with the following technologies:

- **React & TypeScript**: For the main application interface
- **Capacitor**: For accessing native mobile features like call detection
- **Tailwind CSS & Shadcn UI**: For responsive design
- **Background Services**: For continuous monitoring even when the app is not in focus

## Services

### Deepfake API

Located in `src/services/deepfakeApi.ts`, this service handles the communication with the Hugging Face AI model that analyzes audio for deepfake detection. It sends audio files to the API and processes the response.

Key features:
- Sends audio files to Hugging Face API
- Processes API responses into usable detection results
- Includes fallback handling for API failures

### Call Monitor Service

Located in `src/services/callMonitorService.ts`, this service manages phone call detection and monitoring.

Key features:
- Monitors for incoming/outgoing calls
- Provides simulated call functionality for demo purposes
- Notifies the app when calls are detected

### Background Service

Located in `src/services/backgroundService.ts`, this service manages background tasks to ensure call monitoring works even when the app is not in focus.

Key features:
- Manages background tasks via Capacitor's Background Runner
- Sends heartbeat signals to ensure service is running
- Communicates between background processes and the main app

## Usage Guide

### Home Screen (Audio Analysis)

- **Call Monitoring Toggle**: Enable or disable real-time call monitoring
- **Monitor Tab**: Test the detection with a simulated call
- **Record Tab**: Record your own audio for analysis
- **Upload Tab**: Analyze audio files from your device

### Dashboard

- **Protection Statistics**: View summary of your call analysis data
- **Recent Detections**: Browse through your detection history

### Settings

- **Call Monitoring**: Configure how the app responds to deepfakes
- **Detection Settings**: Adjust sensitivity and analysis duration
- **Data Management**: Clear your detection history

## Setup & Development

### Prerequisites

- Node.js and npm installed
- For mobile development: Xcode (iOS) or Android Studio (Android)

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Run the development server:
   ```
   npm run dev
   ```

### Mobile Setup

For iOS:
```
npx cap add ios
npx cap sync
npx cap open ios
```

For Android:
```
npx cap add android
npx cap sync
npx cap open android
```

## Technical Notes

- The app uses a simulated detection in demo mode when the AI API is unavailable
- Call monitoring requires microphone permissions
- Background monitoring is platform-specific and uses native capabilities where available
