// ============================================================================
// SpotLogo — "Spot" · SpotMark · "it" wordmark in Clash Display
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SpotMark } from './SpotMark';
import { colors } from '@/design/tokens';
import { font } from '@/design/theme';

export interface SpotLogoProps {
  size?: number;
  color?: string;
  mark?: boolean;
}

function SpotLogo({ size = 22, color = colors.ink, mark = true }: SpotLogoProps): React.ReactElement {
  const gap = size * 0.16;
  return (
    <View style={[styles.row, { gap }]}>
      <Text
        style={{
          fontFamily: font.displaySemiBold,
          fontWeight: '600',
          fontSize: size,
          letterSpacing: -0.02 * size,
          lineHeight: size * 1.1,
          color,
        }}
      >
        Spot
      </Text>
      {mark ? (
        <SpotMark size={size * 0.5} color={colors.accent} pulse />
      ) : (
        <Text
          style={{
            fontFamily: font.displaySemiBold,
            fontWeight: '600',
            fontSize: size,
            lineHeight: size * 1.1,
            color: colors.accent,
          }}
        >
          .
        </Text>
      )}
      <Text
        style={{
          fontFamily: font.displaySemiBold,
          fontWeight: '600',
          fontSize: size,
          letterSpacing: -0.02 * size,
          lineHeight: size * 1.1,
          color,
        }}
      >
        it
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export { SpotLogo };
export default SpotLogo;
