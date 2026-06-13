// ============================================================================
// Spot.it — design theme  (extends frozen tokens)
// Loads Clash Display from local TTF + Inter from @expo-google-fonts/inter.
// Safe fallback to system fonts if load fails — never crash.
// ============================================================================

import { useFonts as useExpoFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import type { TextStyle } from 'react-native';

// Re-export everything from frozen tokens so consumers only need one import.
export * from './tokens';
export { default as tokens } from './tokens';
export { colors, categories, radius, shadows, spring, motion, fonts } from './tokens';
import type { CategoryId } from './tokens';
export type { CategoryId };

// ─── Font loading ─────────────────────────────────────────────────────────────

/**
 * Call this once in your root _layout. Returns { loaded } — render children
 * unconditionally; fonts fall back to system gracefully.
 */
export function useAppFonts(): { loaded: boolean } {
  const [loaded] = useExpoFonts({
    // Clash Display (display / headings) — downloaded TTFs
    ClashDisplay: require('../assets/fonts/ClashDisplay-Medium.ttf'),
    'ClashDisplay-Medium': require('../assets/fonts/ClashDisplay-Medium.ttf'),
    'ClashDisplay-SemiBold': require('../assets/fonts/ClashDisplay-SemiBold.ttf'),
    'ClashDisplay-Bold': require('../assets/fonts/ClashDisplay-Bold.ttf'),
    // Inter (body)
    Inter: Inter_400Regular,
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });
  return { loaded: loaded ?? false };
}

// ─── Resolved font families ───────────────────────────────────────────────────
// Use these strings in fontFamily — expo-font maps them once loaded.
// If a font fails to load RN silently falls back to the platform default.

export const font = {
  display: 'ClashDisplay',
  displaySemiBold: 'ClashDisplay-SemiBold',
  displayBold: 'ClashDisplay-Bold',
  body: 'Inter',
  bodyMedium: 'Inter-Medium',
  bodySemiBold: 'Inter-SemiBold',
  bodyBold: 'Inter-Bold',
} as const;

// ─── Text presets ─────────────────────────────────────────────────────────────
// Values mirror the design-ref CSS variables exactly.
// Import { text } from '@/design/theme' and spread into your Text style.

import { colors } from './tokens';

export const text: Record<string, TextStyle> = {
  /** Large display — onboarding hero, section headers */
  h1: {
    fontFamily: font.displayBold,
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.8,
    lineHeight: 40,
    color: colors.ink,
  },
  /** Section title — card deck header */
  h2: {
    fontFamily: font.displaySemiBold,
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: -0.5,
    lineHeight: 30,
    color: colors.ink,
  },
  /** Card title, row title */
  title: {
    fontFamily: font.bodySemiBold,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
    lineHeight: 22,
    color: colors.ink,
  },
  /** Regular body copy */
  body: {
    fontFamily: font.body,
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
    color: colors.ink2,
  },
  /** Emphasised body (teaser, short desc) */
  bodyStrong: {
    fontFamily: font.bodyMedium,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
    color: colors.ink,
  },
  /** Secondary metadata, distance, time */
  caption: {
    fontFamily: font.body,
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    color: colors.ink3,
  },
  /** All-caps label chips, tags */
  label: {
    fontFamily: font.bodySemiBold,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    lineHeight: 14,
    color: colors.ink2,
    textTransform: 'uppercase',
  },
};
