import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Spacing, Typography } from '../../theme/worktwinTheme';

interface AnimatedHeaderProps {
  title: string;
  subtitle?: string;
  scrollY: Animated.Value;
}

export const AnimatedHeader: React.FC<AnimatedHeaderProps> = ({
  title,
  subtitle,
  scrollY,
}) => {
  const { colors } = useTheme();
  const headerHeight = 100;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, headerHeight],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const headerTranslate = scrollY.interpolate({
    inputRange: [0, headerHeight],
    outputRange: [0, -headerHeight],
    extrapolate: 'clamp',
  });

  const styles = StyleSheet.create({
    header: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: headerHeight,
      backgroundColor: colors.background,
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.xl,
      zIndex: 1000,
    },
    title: {
      ...Typography.h1,
      color: colors.text,
    },
    subtitle: {
      ...Typography.body,
      color: colors.textSecondary,
      marginTop: Spacing.xs,
    },
  });

  return (
    <Animated.View
      style={[
        styles.header,
        {
          opacity: headerOpacity,
          transform: [{ translateY: headerTranslate }],
        },
      ]}
    >
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </Animated.View>
  );
};