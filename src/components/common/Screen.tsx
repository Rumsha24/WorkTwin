import React from "react";
import { SafeAreaView, StyleSheet, View, ViewStyle } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { Spacing } from "../../theme/worktwinTheme";

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
};

export default function Screen({ children, style }: Props) {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.md,
    },
  });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.container, style]}>{children}</View>
    </SafeAreaView>
  );
}