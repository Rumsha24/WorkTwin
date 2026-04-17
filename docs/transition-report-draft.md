# WorkTwin Transition Report Draft

## Cover Page Details

Replace the placeholders below with your final academic details before submission.

- Project Title: WorkTwin
- Team Member Names: [Add final team member names]
- Team Number: [Add final team number]
- Course Code: PROG8226
- Mentor Name: [Add mentor name]
- Client Name: [Add client name if applicable]
- Due Date: [Add due date]

## User Test Plans and Results

### Test Approach

WorkTwin was validated through scenario-based manual testing across the major user journeys of the mobile application. The focus of testing was to confirm that the app was stable, usable, and presentation-ready for the final capstone submission. Testing covered both productivity and wellness workflows, as well as account access, personalization, and data persistence.

### Functional Areas Tested

- user registration and login
- password-based authentication and session persistence
- task creation, editing, completion, deletion, and reminders
- focus timer presets and custom sessions
- productivity trend and reporting screens
- hydration reminders and water tracking
- break reminders, breathing exercises, and wellness check-ins
- sleep tracking and step logging
- medicine reminders with weekday and dosage options
- period logging, symptoms, mood, and notes
- language switching, theme support, and profile updates
- demo account access and seeded presentation data

### Test Environment

- Framework: React Native with Expo
- Language: TypeScript
- Backend: Firebase Authentication and Firestore
- Local storage: AsyncStorage
- Device targets: Android and iOS through Expo tooling

### Summary of Results

Manual testing confirmed that the main application flows were working as expected for capstone demonstration use. Core productivity features, wellness tracking, account access, and settings behaved reliably during project validation. The seeded demo account also helped confirm that the app could be demonstrated with realistic data without requiring live user setup during presentation.

### Issues and Limitations Observed

- notification behavior in Expo Go is limited compared to a development build
- some interface text still remains in English even though major sections support multiple languages
- local device data can be removed if storage is cleared

### Recommendation

The project is suitable for academic presentation, demonstration, and transition to the next team or evaluator, provided that Firebase credentials and environment variables are configured correctly before execution.

## Deployment Guide

The full deployment guide has been drafted separately in:

- [deployment-guide-draft.md](C:/Users/rumsh/Project/Capstone/WorkTwin/docs/deployment-guide-draft.md)

Summary:

WorkTwin is deployed as an Expo-based React Native mobile application using Firebase Authentication and Firestore rather than IIS and SQL Server. To run the application, install dependencies, configure the Firebase environment variables, start the Expo server, and launch the app on Android, iOS, or web. For packaged builds, use EAS Build to generate installable Android or iOS artifacts.

## User Technical Manual

### Purpose

The user technical manual explains how an end user can access and use WorkTwin's main features.

### Main User Workflows

#### 1. Sign In or Use the Demo Account

Users start by logging in with their own credentials or by using the provided demonstration account for presentation purposes.

#### 2. Manage Tasks

Users can create, edit, categorize, prioritize, complete, and delete tasks. Optional reminders can be enabled to support deadlines and daily planning.

#### 3. Run Focus Sessions

Users can start timer-based focus sessions using presets or custom lengths. Completed sessions contribute to productivity tracking and reporting.

#### 4. Track Wellness

Users can log hydration, sleep, wellness check-ins, steps, medicine reminders, and breathing activities to support healthier routines.

#### 5. Review Insights

Users can review productivity trends and personal history to better understand their performance and habits over time.

#### 6. Personalize the App

Users can adjust settings such as theme, language, profile image, and biometric authentication preferences.

### Support Notes

- Firebase configuration is required for authenticated cloud features.
- Notifications may require a development build for full behavior.
- Some data is stored locally for offline-friendly operation.

## Working Code Demonstration

Add the final recording link here:

- [Insert link to recorded video]

## Transition Notes for the Next Team or Evaluator

- Project name: WorkTwin
- Version shown in Expo configuration: 2.0.0
- Main technologies: React Native, Expo, TypeScript, Firebase, Firestore, AsyncStorage
- Demo account email: `rumsha@worktwin.com`
- Demo account password: `WorkTwin123!`
- Environment file required: `.env`
- Required Firebase values: API key, auth domain, project ID, storage bucket, messaging sender ID, app ID

### Suggested Next Steps

1. Finalize instructor-facing details on the cover page.
2. Replace the placeholder video link with the final demo recording.
3. Add screenshots if your instructor expects a richer technical manual.
4. Review wording against the exact D2L instructions after logging in.
