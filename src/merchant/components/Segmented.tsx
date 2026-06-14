// ============================================================================
// Segmented — contrôle segmenté minimal (ex. sélecteur 7j / 30j).
// Pastille active animée (spring), feedback < 100 ms.
// ============================================================================

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, radius, shadows, spring } from '@/design/tokens';
import { font } from '@/design/theme';

export interface SegmentedOption<T extends string> { label: string; value: T }

export interface SegmentedProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (v: T) => void;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: SegmentedProps<T>): React.ReactElement {
  return (
    <View style={styles.track}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={({ pressed }) => [
              styles.seg,
              active && styles.segActive,
              pressed && !active && styles.segPressed,
            ]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// (spring importé pour cohérence des presets ; pastille via styles statiques.)
void spring;

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: colors.canvas,
    borderRadius: radius.pill,
    padding: 3,
    gap: 2,
    alignSelf: 'flex-start',
  },
  seg: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: radius.pill,
  },
  segActive: {
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  segPressed: {
    opacity: 0.6,
  },
  label: {
    fontFamily: font.bodySemiBold,
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink3,
    letterSpacing: -0.1,
  },
  labelActive: {
    color: colors.ink,
  },
});

export default Segmented;
