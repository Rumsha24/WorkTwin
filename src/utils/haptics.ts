import * as Haptics from 'expo-haptics';

export const haptics = {
  light: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },
  medium: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },
  heavy: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  },
  success: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },
  warning: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  },
  error: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },
  taskComplete: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 100);
  },
  timerComplete: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }, 200);
  },
  switch: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },
  longPress: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  },
};