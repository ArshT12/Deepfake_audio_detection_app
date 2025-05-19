
# Voice Guardian Shield

Voice Guardian Shield is a mobile application designed to protect users from deepfake voice scams by analyzing voice calls in real-time and alerting users when a deepfake voice is detected.

## App Structure

### 1. Main Components

- **Audio Analysis (Home Page)**
  - Real-time call monitoring
  - Call simulation demo
  - Audio recording and analysis
  - File upload and analysis

- **Dashboard**
  - Protection statistics
  - Detection history

- **Settings**
  - Call monitoring options
  - Detection sensitivity settings
  - Data management

### 2. Core Services

- **Deepfake Detection API** (`src/services/deepfakeApi.ts`)
  - Communicates with Hugging Face AI model
  - Analyzes audio for synthetic voices
  - Provides detection confidence scores

- **Call Monitor Service** (`src/services/callMonitorService.ts`)
  - Detects and monitors phone calls
  - Provides simulated calls for demo purposes
  - Passes audio for analysis

- **Background Service** (`src/services/backgroundService.ts`)
  - Enables background operation
  - Maintains monitoring when app is not in focus

### 3. Key Features

- **Real-time Call Monitoring**: Analyzes ongoing calls for deepfake voices
- **Manual Audio Analysis**: Upload or record audio for detection
- **Call Demo**: Test the deepfake detection with simulated calls
- **Detection History**: View and manage past detection records
- **Configurable Settings**: Customize detection thresholds

### 4. State Management

The app uses React Context (`AppContext`) to manage:
- Detection history records
- User settings
- Monitoring state

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

## Technical Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Mobile Framework**: Capacitor
- **UI Components**: Shadcn UI
- **State Management**: Context API and React Query
- **AI Integration**: Hugging Face API
