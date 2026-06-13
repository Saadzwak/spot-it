// ============================================================================
// Primitives — Screen, Card, Pill, PrimaryButton, GhostButton, Sheet,
//              SectionTitle, Toggle
// ============================================================================

import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Pressable,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { colors, radius, shadows, spring, motion } from '@/design/tokens';
import { font, text } from '@/design/theme';
import { Icon } from './Icon';

// ─── Screen ──────────────────────────────────────────────────────────────────

export interface ScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
  scroll?: boolean;
  padded?: boolean;
}

export function Screen({ children, style, scroll = false, padded = true }: ScreenProps): React.ReactElement {
  const inner: ViewStyle = padded ? { paddingHorizontal: 16 } : {};
  if (scroll) {
    return (
      <SafeAreaView style={[styles.screen, style]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={inner}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={[styles.screen, style]}>
      <View style={[{ flex: 1 }, inner]}>{children}</View>
    </SafeAreaView>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

export interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}

export function Card({ children, style, onPress }: CardProps): React.ReactElement {
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.card, { opacity: pressed ? 0.96 : 1 }, style]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

// ─── Pill ─────────────────────────────────────────────────────────────────────

export interface PillProps {
  children: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Pill({ children, style, textStyle }: PillProps): React.ReactElement {
  return (
    <View style={[styles.pill, style]}>
      {typeof children === 'string' ? (
        <Text style={[styles.pillText, textStyle]}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}

// ─── PrimaryButton ────────────────────────────────────────────────────────────

export interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export function PrimaryButton({ label, onPress, icon, disabled = false }: PrimaryButtonProps): React.ReactElement {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        onPressIn={() => { scale.value = withSpring(0.96, spring); }}
        onPressOut={() => { scale.value = withSpring(1, spring); }}
        activeOpacity={0.88}
        style={[styles.primaryBtn, disabled && styles.primaryBtnDisabled]}
      >
        {icon && <View style={styles.primaryBtnIcon}>{icon}</View>}
        <Text style={styles.primaryBtnLabel}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── GhostButton ──────────────────────────────────────────────────────────────

export interface GhostButtonProps {
  label: string;
  onPress: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export function GhostButton({ label, onPress, icon, disabled = false }: GhostButtonProps): React.ReactElement {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[styles.ghostBtn, disabled && styles.ghostBtnDisabled]}
    >
      {icon && <View style={styles.primaryBtnIcon}>{icon}</View>}
      <Text style={styles.ghostBtnLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Sheet ────────────────────────────────────────────────────────────────────

export interface SheetProps {
  children: React.ReactNode;
  onClose?: () => void;
}

export function Sheet({ children, onClose }: SheetProps): React.ReactElement {
  const translateY = useSharedValue(400);

  useEffect(() => {
    translateY.value = withSpring(0, spring);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.sheet, animStyle]}>
      {/* Handle */}
      <View style={styles.sheetHandle} />
      {onClose && (
        <TouchableOpacity onPress={onClose} style={styles.sheetClose} hitSlop={12}>
          <Icon name="close" size={20} color={colors.ink2} />
        </TouchableOpacity>
      )}
      {children}
    </Animated.View>
  );
}

// ─── SectionTitle ─────────────────────────────────────────────────────────────

export interface SectionTitleProps {
  children: React.ReactNode;
  style?: TextStyle;
}

export function SectionTitle({ children, style }: SectionTitleProps): React.ReactElement {
  return (
    <Text style={[styles.sectionTitle, style]}>{children}</Text>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

export interface ToggleProps {
  value: boolean;
  onValueChange: (v: boolean) => void;
  label?: string;
  sublabel?: string;
  disabled?: boolean;
}

export function Toggle({ value, onValueChange, label, sublabel, disabled = false }: ToggleProps): React.ReactElement {
  return (
    <View style={styles.toggleRow}>
      {(label || sublabel) && (
        <View style={styles.toggleTextCol}>
          {label && <Text style={styles.toggleLabel}>{label}</Text>}
          {sublabel && <Text style={styles.toggleSublabel}>{sublabel}</Text>}
        </View>
      )}
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: colors.line, true: colors.accent }}
        thumbColor={colors.white}
        ios_backgroundColor={colors.line}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    ...shadows.card,
    overflow: 'hidden',
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  pillText: {
    ...text.caption,
    color: colors.ink2,
  } as TextStyle,
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: 16,
    paddingHorizontal: 28,
    gap: 8,
    ...shadows.sm,
  },
  primaryBtnDisabled: {
    opacity: 0.45,
  },
  primaryBtnIcon: {
    marginRight: 4,
  },
  primaryBtnLabel: {
    fontFamily: font.bodyBold,
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: -0.2,
  },
  ghostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.line,
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 8,
  },
  ghostBtnDisabled: {
    opacity: 0.45,
  },
  ghostBtnLabel: {
    fontFamily: font.bodySemiBold,
    fontSize: 15,
    fontWeight: '600',
    color: colors.ink,
    letterSpacing: -0.2,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 32,
    ...shadows.card,
    // The sheet itself acts as bottom-sheet container
    minHeight: 120,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.line,
    alignSelf: 'center',
    marginBottom: 8,
  },
  sheetClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  sectionTitle: {
    fontFamily: font.displaySemiBold,
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.4,
    color: colors.ink,
    marginBottom: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  toggleTextCol: {
    flex: 1,
    gap: 2,
  },
  toggleLabel: {
    fontFamily: font.bodySemiBold,
    fontSize: 15,
    fontWeight: '600',
    color: colors.ink,
  },
  toggleSublabel: {
    fontFamily: font.body,
    fontSize: 13,
    color: colors.ink3,
    lineHeight: 18,
  },
});
