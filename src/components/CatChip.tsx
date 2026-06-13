// ============================================================================
// CatChip + CatDot — category pill and dot indicator
// Ports design-ref/spot-it/app/ui.jsx → CatChip, CatDot
// ============================================================================

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { categories } from '@/design/tokens';
import { font } from '@/design/theme';
import type { CategoryId } from '@/design/tokens';

// ─── CatChip ──────────────────────────────────────────────────────────────────

export interface CatChipProps {
  catId: CategoryId;
  active?: boolean;
  onPress?: () => void;
}

export function CatChip({ catId, active = false, onPress }: CatChipProps): React.ReactElement | null {
  const cat = categories[catId];
  if (!cat) return null;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.78}
      style={[
        styles.chip,
        { backgroundColor: active ? cat.hue : cat.tint },
      ]}
    >
      {/* Dot indicator */}
      <View
        style={[
          styles.dot,
          { backgroundColor: active ? '#fff' : cat.hue },
        ]}
      />
      <Text
        style={[
          styles.label,
          { color: active ? '#fff' : cat.hue },
        ]}
      >
        {cat.label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── CatDot ───────────────────────────────────────────────────────────────────

export interface CatDotProps {
  catId: CategoryId;
  size?: number;
}

export function CatDot({ catId, size = 7 }: CatDotProps): React.ReactElement {
  const cat = categories[catId];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: cat ? cat.hue : '#9C9087',
        flexShrink: 0,
      }}
    />
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  label: {
    fontFamily: font.bodySemiBold,
    fontWeight: '600',
    fontSize: 14,
    letterSpacing: -0.14,
  },
});

export default CatChip;
