import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Spacing, BorderRadius } from '../../theme/worktwinTheme';

export function TaskListSkeleton() {
  const { colors } = useTheme();
  const fadeAnim = new Animated.Value(0.3);

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.7,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: Spacing.lg,
    },
    skeletonItem: {
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
      height: 80,
    },
  });

  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Animated.View
          key={i}
          style={[
            styles.skeletonItem,
            {
              opacity: fadeAnim,
            },
          ]}
        />
      ))}
    </View>
  );
}