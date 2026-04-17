# WorkTwin Deployment Guide

## About WorkTwin

WorkTwin is a cross-platform mobile productivity and wellness application built as a Mobile Solutions capstone project. The app helps users manage daily tasks, improve focus through timer-based sessions, and track health habits such as hydration, sleep, steps, medicine reminders, and wellness check-ins. It also includes female health tracking, personalized settings, multi-language support, and a seeded demo account for presentations.

The target audience is students and busy professionals who want one mobile app that supports both productivity and wellbeing without switching between multiple tools.

## Quick Start

Use these steps to run the simplest working version of WorkTwin on a development machine.

### Prerequisites

- Node.js 18 or later
- npm
- Expo CLI through `npx expo`
- A Firebase project with Authentication and Firestore enabled
- An Android emulator, iOS simulator, or Expo Go / development build on a physical device

### Environment Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the project root based on `.env.example`.

3. Add the Firebase configuration values:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

4. Start the Expo development server:

```bash
npx expo start
```

5. Run the app on one of the supported targets:

```bash
npm run android
npm run ios
npm run web
```

## Deployment Instructions

This template was originally written for an IIS and SQL Server application. WorkTwin uses a different architecture, so the deployment process below has been adapted to match the real project.

### Application Architecture

- Frontend: React Native with Expo and TypeScript
- Authentication: Firebase Authentication
- Cloud data: Firebase Firestore
- Local device storage: AsyncStorage
- Notifications: Expo Notifications
- Device features: Expo Local Authentication, Expo Image Picker, Expo Sensors

### How to Create the Database

WorkTwin does not use Microsoft SQL Server. Instead, it stores authenticated user data in Firebase Firestore and local device data in AsyncStorage.

To prepare the backend:

1. Sign in to the Firebase Console and create a new project.
2. Enable Firebase Authentication.
3. Enable the sign-in methods required by the app. Email/password is required for the main login flow.
4. Create a Firestore database in production mode or test mode depending on the deployment stage.
5. Configure Firestore security rules so users can access only their own data.
6. Copy the Firebase web app configuration values into the project `.env` file.

Suggested Firestore collections can include:

- users
- tasks
- focusSessions
- productivity
- medicines
- wellness logs
- period logs

Note: some project data is also stored locally on the device through AsyncStorage for offline and presentation-friendly behavior.

### How to Install and Configure the Application

#### Development Deployment

1. Clone or copy the project to the target machine.
2. Run `npm install`.
3. Create the `.env` file with Firebase values.
4. Run `npx expo start`.
5. Open the project in an emulator, simulator, Expo Go, or development build.

#### Mobile Build Deployment

For presentation or production-style distribution, create platform builds with Expo tooling.

1. Install EAS CLI if required:

```bash
npm install -g eas-cli
```

2. Log in to Expo:

```bash
eas login
```

3. Configure the project for EAS Build:

```bash
eas build:configure
```

4. Build for Android or iOS:

```bash
eas build --platform android
eas build --platform ios
```

5. Distribute the generated build to the test device or submission environment.

### How to Access the Application

After deployment, users can access WorkTwin in one of the following ways:

- through Expo Go or a development build during testing
- through an Android APK / AAB or iOS build created with EAS
- through the web target if the course demonstration allows web execution

For classroom demonstration, the project includes a seeded demo account:

- Email: `rumsha@worktwin.com`
- Password: `WorkTwin123!`

## Operational Notes

### Notifications

- Local notifications are handled through `expo-notifications`.
- Full notification behavior may require a development build instead of Expo Go.

### Authentication and Data

- Firebase Authentication manages account sign-in.
- Firestore stores synchronized cloud data.
- AsyncStorage stores local and offline-friendly data on the device.

### Backup and Restore

- The project includes backup and restore support through app services and local storage utilities.
- Restoring local data does not replace secure Firebase configuration and does not substitute for normal cloud backups.

## Known Limitations

- Some notification behavior is limited in Expo Go.
- Multi-language support is implemented for major sections, but some labels may remain in English.
- Device-local data can be cleared by uninstalling the app or removing storage.
- Final production deployment would require institution-owned Firebase credentials and finalized security rules.

## Recommended Submission Note

If this guide is submitted against the provided template, add a short note explaining that the original template referenced SQL Server and IIS, but WorkTwin is a mobile Expo/Firebase application and therefore required an architecture-appropriate deployment guide.
