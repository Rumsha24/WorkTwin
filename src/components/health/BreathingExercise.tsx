import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Spacing, BorderRadius, Typography } from '../../theme/worktwinTheme';
import { haptics } from '../../utils/haptics';

interface BreathingExerciseProps {
  visible: boolean;
  onClose: () => void;
}

export function BreathingExercise({ visible, onClose }: BreathingExerciseProps) {
  const { colors } = useTheme();
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [progress, setProgress] = useState(0);
  const breathAnim = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (visible) {
      startExercise();
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [visible]);

  const startExercise = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    let step = 0;
    setProgress(0);
    setPhase('inhale');

    Animated.timing(breathAnim, {
      toValue: 1.3,
      duration: 4000,
      useNativeDriver: true,
    }).start();

    intervalRef.current = setInterval(() => {
      step = (step + 1) % 12;

      if (step % 3 === 0) {
        setPhase('inhale');
        Animated.timing(breathAnim, {
          toValue: 1.3,
          duration: 4000,
          useNativeDriver: true,
        }).start();
      } else if (step % 3 === 1) {
        setPhase('hold');
      } else {
        setPhase('exhale');
        Animated.timing(breathAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }).start();
      }

      setProgress(step + 1);
    }, 4000);
  };

  const stopExercise = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    haptics.medium();
    onClose();
  };

  const getPhaseText = () => {
    switch (phase) {
      case 'inhale':
        return 'Breathe In...';
      case 'hold':
        return 'Hold...';
      case 'exhale':
        return 'Breathe Out...';
      default:
        return 'Breathe';
    }
  };

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    circle: {
      width: 220,
      height: 220,
      borderRadius: 110,
      backgroundColor: colors.primary + '20',
      borderWidth: 4,
      borderColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: {
      ...Typography.h1,
      color: colors.primary,
      fontSize: 24,
      marginTop: Spacing.xl,
    },
    progressText: {
      ...Typography.body,
      color: colors.textSecondary,
      marginTop: Spacing.md,
    },
    button: {
      marginTop: Spacing.xxl,
      backgroundColor: colors.primary,
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.lg,
      borderRadius: BorderRadius.lg,
    },
    buttonText: {
      ...Typography.button,
      color: colors.text,
    },
  });

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <Animated.View style={[styles.circle, { transform: [{ scale: breathAnim }] }]}>
          <Ionicons name="leaf" size={80} color={colors.primary} />
        </Animated.View>
        <Text style={styles.text}>{getPhaseText()}</Text>
        <Text style={styles.progressText}>{progress}/12 cycles</Text>
        <TouchableOpacity style={styles.button} onPress={stopExercise} activeOpacity={0.85}>
          <Text style={styles.buttonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}