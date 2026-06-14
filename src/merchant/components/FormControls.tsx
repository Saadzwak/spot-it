// ============================================================================
// FormControls — SelectPill (choix) + Stepper (incrément). Réutilisés par
// le catalogue et le ciblage. Feedback pressé < 100 ms.
// ============================================================================

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, radius, shadows } from '@/design/tokens';
import { font } from '@/design/theme';

// ── SelectPill ─────────────────────────────────────────────────────────────
export function SelectPill({
  label, active, onPress,
}: {
  label: string; active: boolean; onPress: () => void;
}): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.selPill,
        active && styles.selPillActive,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.selPillLabel, active && styles.selPillLabelActive]}>{label}</Text>
    </Pressable>
  );
}

// ── Stepper ────────────────────────────────────────────────────────────────
export function Stepper({
  onDecrement, onIncrement, display,
}: {
  onDecrement: () => void; onIncrement: () => void; display: string;
}): React.ReactElement {
  return (
    <View style={styles.stepper}>
      <Pressable onPress={onDecrement} style={({ pressed }) => [styles.stepBtn, pressed && styles.pressed]} hitSlop={8}>
        <Text style={styles.stepBtnLabel}>−</Text>
      </Pressable>
      <Text style={styles.stepValue}>{display}</Text>
      <Pressable onPress={onIncrement} style={({ pressed }) => [styles.stepBtn, pressed && styles.pressed]} hitSlop={8}>
        <Text style={styles.stepBtnLabel}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.7 },
  selPill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.line,
    ...shadows.sm,
  },
  selPillActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  selPillLabel: {
    fontFamily: font.bodySemiBold,
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink2,
  },
  selPillLabelActive: { color: colors.white },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.line,
    overflow: 'hidden',
    ...shadows.sm,
  },
  stepBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnLabel: {
    fontFamily: font.bodyBold,
    fontSize: 20,
    color: colors.ink,
    lineHeight: 24,
  },
  stepValue: {
    fontFamily: font.bodySemiBold,
    fontSize: 16,
    fontWeight: '600',
    color: colors.ink,
    minWidth: 72,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
});

export default SelectPill;
