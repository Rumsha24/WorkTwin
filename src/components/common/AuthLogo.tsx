import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Circle,
  Rect,
  Path,
  Line,
} from 'react-native-svg';

import { BorderRadius, Shadows, Spacing, Typography } from '../../theme/worktwinTheme';
import { useTheme } from '../../context/ThemeContext';

type AuthLogoProps = {
  compact?: boolean;
};

type StopwatchLogoProps = {
  primary: string;
  secondary: string;
  accent: string;
  face: string;
  muted: string;
  hand: string;
};

function StopwatchLogo({ primary, secondary, accent, face, muted, hand }: StopwatchLogoProps) {
  return (
    <Svg width={52} height={52} viewBox="0 0 128 128">
      <Defs>
        <LinearGradient id="gradMain" x1="0%" y1="100%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor={primary} />
          <Stop offset="58%" stopColor={secondary} />
          <Stop offset="100%" stopColor={accent} />
        </LinearGradient>

        <LinearGradient id="gradFace" x1="0%" y1="100%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor={face} />
          <Stop offset="100%" stopColor={face} />
        </LinearGradient>
      </Defs>

      {/* top button */}
      <Rect x="42" y="6" width="44" height="10" rx="3" fill="url(#gradMain)" />

      {/* stem */}
      <Rect x="59" y="16" width="10" height="12" rx="3" fill="url(#gradMain)" />

      {/* side buttons */}
      <Rect
        x="18"
        y="28"
        width="18"
        height="8"
        rx="3"
        fill="url(#gradMain)"
        transform="rotate(-45 27 32)"
      />
      <Rect
        x="92"
        y="28"
        width="18"
        height="8"
        rx="3"
        fill="url(#gradMain)"
        transform="rotate(45 101 32)"
      />

      {/* outer ring */}
      <Circle cx="64" cy="72" r="46" fill="none" stroke="url(#gradMain)" strokeWidth="8" />
      <Circle cx="64" cy="72" r="37" fill="url(#gradFace)" stroke={muted} strokeWidth="2" />

      {/* hour marks */}
      <Line x1="64" y1="36" x2="64" y2="44" stroke={hand} strokeWidth="3" strokeLinecap="round" />
      <Line x1="64" y1="100" x2="64" y2="108" stroke={hand} strokeWidth="3" strokeLinecap="round" />
      <Line x1="28" y1="72" x2="36" y2="72" stroke={hand} strokeWidth="3" strokeLinecap="round" />
      <Line x1="92" y1="72" x2="100" y2="72" stroke={hand} strokeWidth="3" strokeLinecap="round" />

      <Line x1="38" y1="46" x2="43" y2="51" stroke={hand} strokeWidth="3" strokeLinecap="round" />
      <Line x1="85" y1="93" x2="90" y2="98" stroke={hand} strokeWidth="3" strokeLinecap="round" />
      <Line x1="38" y1="98" x2="43" y2="93" stroke={hand} strokeWidth="3" strokeLinecap="round" />
      <Line x1="85" y1="51" x2="90" y2="46" stroke={hand} strokeWidth="3" strokeLinecap="round" />

      {/* hands */}
      <Path d="M64 72 L64 53" stroke="url(#gradMain)" strokeWidth="4" strokeLinecap="round" />
      <Path d="M64 72 L83 61" stroke={hand} strokeWidth="4" strokeLinecap="round" />

      {/* center */}
      <Circle cx="64" cy="72" r="5" fill="url(#gradMain)" stroke={hand} strokeWidth="1.5" />
    </Svg>
  );
}

export function AuthLogo({ compact = false }: AuthLogoProps) {
  const { colors, isDarkMode } = useTheme();
  const cardBackground = isDarkMode ? '#101827' : '#FFFFFF';
  const iconBackground = isDarkMode ? '#172033' : '#F8FAFC';
  const textMuted = isDarkMode ? '#CBD5E1' : '#64748B';

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: cardBackground, borderColor: colors.border },
        compact && styles.cardCompact,
      ]}
    >
      <View style={styles.logoRow}>
        <View style={[styles.iconShell, { backgroundColor: iconBackground, borderColor: colors.border }]}>
          <StopwatchLogo
            primary={colors.primary}
            secondary={colors.secondary}
            accent={colors.success}
            face={isDarkMode ? '#1E293B' : '#F8FAFC'}
            muted={colors.border}
            hand={colors.text}
          />
        </View>

        <View>
          <Text style={[styles.wordmark, { color: colors.primary }, compact && styles.wordmarkCompact]}>
            Work
            <Text style={{ color: colors.secondary }}>Twin</Text>
          </Text>
          <Text style={[styles.tagline, { color: textMuted }]}>Focus smarter. Track better.</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 96,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.xxl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    ...Shadows.large,
  },
  cardCompact: {
    height: 86,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconShell: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    borderWidth: 1,
  },
  wordmark: {
    ...Typography.h1,
    fontSize: 30,
    letterSpacing: -0.6,
  },
  wordmarkCompact: {
    fontSize: 28,
  },
  tagline: {
    ...Typography.caption,
    marginTop: Spacing.xs,
    letterSpacing: 0.5,
  },
});
