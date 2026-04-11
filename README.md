# WorkTwin

WorkTwin is a mobile productivity and wellness application developed as a capstone project for the Mobile Solutions program. The project was designed to address a common student and professional need: managing productivity, focus, and personal wellbeing within a single mobile experience. The application combines task management, focus tools, health logging, and personal insights to support more balanced daily routines.

## Project Overview

The purpose of WorkTwin is to provide users with an integrated platform for:

- planning and tracking daily tasks
- improving focus through timer-based work sessions
- monitoring productivity trends over time
- supporting health and wellness habits such as hydration, sleep, steps, and medicine reminders
- providing female users with period logging and related insights

This project was completed using an agile, iteration-based development approach, with Iteration 3 focused on advanced features, quality improvements, testing, and presentation readiness.

## Objectives

The main objectives of the project were:

- to build a user-friendly cross-platform mobile application using React Native and Expo
- to integrate productivity and wellness features into one cohesive solution
- to provide secure authentication and personalized user data
- to support visual insights that help users reflect on progress and habits
- to create a polished academic capstone application suitable for demonstration and evaluation

## Key Features

### Productivity Features

- Email/password authentication with Firebase
- Task creation, completion, editing, and deletion
- Task categories, priorities, due date, due time, and reminders
- Focus timer with multiple presets and custom sessions
- Task-linked focus sessions
- Productivity trend charts and advanced reports
- Goals system and achievements
- Backup and restore support

### Health and Wellness Features

- Hydration reminders and water intake tracking
- Break reminders
- Breathing exercises
- Wellness check-ins
- Sleep tracking
- Step tracking and goal updates
- Medicine reminders with:
  - selected weekdays
  - once-daily or twice-daily reminders
  - before-meal and after-meal scheduling
- Period logging for female users with symptoms, mood, notes, and insights

### Personalization Features

- Dark mode support
- Biometric authentication option
- Profile image upload
- Multi-language support for major app sections
- Demo presentation account with pre-seeded data

## Technology Stack

- React Native
- Expo
- TypeScript
- Firebase Authentication
- Firebase Firestore
- AsyncStorage
- Expo Notifications
- Expo Local Authentication
- Expo Image Picker
- Expo Sensors
- React Navigation
- React Native Chart Kit

## System Structure

```text
src/
  components/    Reusable interface components
  context/       Authentication, theme, and language state
  hooks/         Business logic for tasks, health, and productivity
  navigation/    Navigation flow and tab configuration
  screens/       Auth, dashboard, tasks, timer, insights, and settings
  services/      Firebase and notification configuration
  theme/         Theme definitions and color system
  utils/         Storage, demo data, import/export, and helper utilities
```

## Setup Instructions

### Prerequisites

- Node.js 18 or higher
- npm
- Expo CLI through `npx expo`
- A configured Firebase project

### Environment Variables

Create a `.env` file using `.env.example` and provide the Firebase values below:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
```

### Installation

```bash
npm install
```

### Running the Application

```bash
npx expo start
```

Optional platform commands:

```bash
npm run android
npm run ios
npm run web
```

## Demo Account

For presentation purposes, the project includes a seeded demo account:

- Email: `rumsha@worktwin.com`
- Password: `WorkTwin123!`
- Demo user: `Rumsha Ahmed`

This account is intended for academic demonstration only. Seeded presentation data is limited to the demo account and does not automatically appear for other users.

## Testing and Validation

The project was validated primarily through manual testing across the main application flows, including:

- authentication and password management
- task creation and reminder setup
- focus timer sessions and productivity trend updates
- medicine scheduling and wellness reminders
- period logging and female health insights
- settings, language selection, and profile management

Type checking:

```bash
npx tsc --noEmit
```

Unit tests:

```bash
npm test -- --runInBand
```

## Known Limitations

- `expo-notifications` has limited support in Expo Go; full notification behavior requires a development build.
- Multi-language support has been added to major app sections, but some interface text may still remain in English.
- Clearing local data removes device-stored data only. Cloud-synced data can reappear when the user is online.

## GitHub Portfolio Summary

WorkTwin is a polished React Native capstone project that showcases:

- end-to-end mobile app development
- Firebase authentication and persistent user data
- productivity-focused UX design
- wellness and health feature integration
- state management with contexts and hooks
- charting, notifications, local storage, and device features
- iterative debugging, testing, and UI refinement

This project demonstrates both technical implementation and product thinking by combining user productivity, health tracking, and presentation-ready design in one mobile application.

## Version Information

- Project name: `WorkTwin`
- Expo app version: `2.0.0`
- Platform target: Android and iOS

## Academic Context

This application was developed as part of a Mobile Solutions Capstone Project and reflects iterative planning, release-based development, testing, validation, and final refinement suitable for academic evaluation and project presentation.
