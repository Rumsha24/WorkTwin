import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';

import { useTheme } from '../context/ThemeContext';
import { Spacing, Typography, BorderRadius } from '../theme/worktwinTheme';
import { auth, db } from '../services/firebaseConfig';

interface SplashScreenProps {
  onFinish: () => void;
  onError?: (error: string) => void;
}

export default function SplashScreen({ onFinish, onError }: SplashScreenProps) {
  const { colors } = useTheme();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const [status, setStatus] = useState('Initializing...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const start = async () => {
      try {
        setStatus('Loading...');
        await animateIn();

        if (!mounted) return;

        setStatus('Checking connection...');
        await testFirebaseConnection();

        if (!mounted) return;

        setStatus('Checking account...');
        await checkAuthStatus();

        if (!mounted) return;

        setStatus('Ready');
        await wait(500);

        if (!mounted) return;

        await animateOut();
        if (mounted) onFinish();
      } catch (err: any) {
        const message = err?.message || 'Failed to initialize app';
        console.error('Splash screen error:', err);
        if (mounted) {
          setError(message);
          onError?.(message);
        }
      }
    };

    start();

    return () => {
      mounted = false;
      rotateAnim.stopAnimation();
    };
  }, []);

  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const animateIn = () =>
    new Promise<void>((resolve) => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 50,
          useNativeDriver: true,
        }),
      ]).start(() => resolve());

      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2200,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    });

  const animateOut = () =>
    new Promise<void>((resolve) => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start(() => resolve());
    });

  const testFirebaseConnection = async () => {
    try {
      const testCollection = collection(db, '_test_');
      await getDocs(testCollection).catch(() => {
        return;
      });
    } catch (err: any) {
      if (err?.code === 'permission-denied') {
        throw new Error('Firebase permissions error. Enable Firestore and check rules.');
      }
      if (err?.code === 'unavailable') {
        throw new Error('Network unavailable. Check your internet connection.');
      }
      throw new Error(err?.message || 'Firebase connection failed.');
    }
  };

  const checkAuthStatus = () =>
    new Promise<void>((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, () => {
        unsubscribe();
        resolve();
      });
    });

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Spacing.xl,
    },
    logoContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    icon: {
      marginBottom: Spacing.lg,
    },
    title: {
      ...Typography.h1,
      fontSize: 44,
      color: colors.primary,
      marginBottom: Spacing.sm,
    },
    subtitle: {
      ...Typography.body,
      color: colors.textSecondary,
      fontSize: 16,
      marginBottom: Spacing.xl,
      textAlign: 'center',
    },
    statusContainer: {
      marginTop: Spacing.xxl,
      alignItems: 'center',
    },
    statusText: {
      ...Typography.caption,
      color: colors.textSecondary,
      marginTop: Spacing.md,
      textAlign: 'center',
    },
    errorText: {
      ...Typography.body,
      color: colors.danger,
      marginTop: Spacing.md,
      textAlign: 'center',
    },
    retryButton: {
      marginTop: Spacing.lg,
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.md,
      backgroundColor: colors.primary,
      borderRadius: BorderRadius.lg,
    },
    retryText: {
      color: colors.text,
      fontWeight: '600',
    },
  });

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.logoContainer}>
          <Ionicons name="alert-circle" size={80} color={colors.danger} style={styles.icon} />
          <Text style={styles.title}>Connection Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              setStatus('Retrying...');
              fadeAnim.setValue(0);
              scaleAnim.setValue(0.85);
              rotateAnim.setValue(0);

              (async () => {
                try {
                  await animateIn();
                  setStatus('Checking connection...');
                  await testFirebaseConnection();
                  setStatus('Checking account...');
                  await checkAuthStatus();
                  setStatus('Ready');
                  await wait(500);
                  await animateOut();
                  onFinish();
                } catch (err: any) {
                  const message = err?.message || 'Failed to initialize app';
                  setError(message);
                  onError?.(message);
                }
              })();
            }}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }, { rotate: spin }],
          },
        ]}
      >
        <Ionicons
          name="timer-outline"
          size={100}
          color={colors.primary}
          style={styles.icon}
        />
        <Text style={styles.title}>WorkTwin</Text>
        <Text style={styles.subtitle}>Focus • Track • Achieve</Text>
      </Animated.View>

      <View style={styles.statusContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.statusText}>{status}</Text>
      </View>
    </SafeAreaView>
  );
}