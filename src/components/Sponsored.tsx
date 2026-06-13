// ============================================================================
// Sponsored — "Sponsorisé" tag
// Ports design-ref/spot-it/app/ui.jsx → Sponsored
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors } from '@/design/tokens';
import { font } from '@/design/theme';

export interface SponsoredProps {
  dark?: boolean;
}

function Sponsored({ dark = false }: SponsoredProps): React.ReactElement {
  if (dark) {
    return (
      <BlurView intensity={32} tint="dark" style={styles.tag}>
        <Text style={[styles.label, styles.labelDark]}>Sponsorisé</Text>
      </BlurView>
    );
  }
  return (
    <View style={[styles.tag, styles.tagLight]}>
      <Text style={[styles.label, styles.labelLight]}>Sponsorisé</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    overflow: 'hidden',
  },
  tagLight: {
    backgroundColor: 'rgba(23,19,15,0.06)',
  },
  label: {
    fontFamily: font.bodySemiBold,
    fontWeight: '600',
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  labelLight: {
    color: colors.ink2,
  },
  labelDark: {
    color: 'rgba(255,255,255,0.92)',
  },
});

export { Sponsored };
export default Sponsored;
