// ============================================================================
// WhyForYou — "Pourquoi pour toi ✨" AI reasoning card
// Ports design-ref/spot-it/app/ui.jsx → WhyForYou
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Icon } from './Icon';
import { colors } from '@/design/tokens';
import { font } from '@/design/theme';

export interface WhyForYouProps {
  text: string;
  dark?: boolean;
  compact?: boolean;
}

function WhyForYou({ text, dark = false, compact = false }: WhyForYouProps): React.ReactElement {
  const iconColor = dark ? '#fff' : colors.accentInk;
  const textColor = dark ? '#fff' : colors.accentInk;
  const headingOpacity = 0.7;
  const pad = compact ? { paddingVertical: 10, paddingHorizontal: 12 } : { paddingVertical: 12, paddingHorizontal: 14 };

  if (dark) {
    return (
      <BlurView intensity={40} tint="dark" style={[styles.container, pad]}>
        <View style={styles.iconWrap}>
          <Icon name="sparkle" size={16} color={iconColor} />
        </View>
        <View style={styles.textBlock}>
          <Text style={[styles.heading, { color: textColor, opacity: headingOpacity }]}>Pourquoi pour toi</Text>
          <Text style={[styles.body, { color: textColor, fontSize: compact ? 13 : 14 }]}>{text}</Text>
        </View>
      </BlurView>
    );
  }

  return (
    <View style={[styles.container, styles.containerLight, pad]}>
      <View style={styles.iconWrap}>
        <Icon name="sparkle" size={16} color={iconColor} />
      </View>
      <View style={styles.textBlock}>
        <Text style={[styles.heading, { color: textColor, opacity: headingOpacity }]}>Pourquoi pour toi</Text>
        <Text style={[styles.body, { color: textColor, fontSize: compact ? 13 : 14 }]}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    borderRadius: 14,
    overflow: 'hidden',
  },
  containerLight: {
    backgroundColor: colors.accentSoft,
  },
  iconWrap: {
    marginTop: 1,
    flexShrink: 0,
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  heading: {
    fontFamily: font.bodySemiBold,
    fontWeight: '600',
    fontSize: 11.5,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  body: {
    fontFamily: font.bodyMedium,
    fontWeight: '500',
    lineHeight: 19,
  },
});

export { WhyForYou };
export default WhyForYou;
