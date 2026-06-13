// ============================================================================
// Merchant layout — Stack with custom top nav (Dashboard / Catalogue / Ciblage)
// Web-first: centered at max-width 960, safe on native.
// ============================================================================

import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { Stack, usePathname, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, shadows } from '@/design/tokens';
import { font } from '@/design/theme';
import { hasSupabase } from '@/lib/env';

const NAV_ITEMS = [
  { label: 'Dashboard',  href: '/(merchant)/dashboard'  },
  { label: 'Catalogue',  href: '/(merchant)/catalog'    },
  { label: 'Ciblage',    href: '/(merchant)/targeting'  },
] as const;

export default function MerchantLayout() {
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const isLive = hasSupabase();

  // Determine active tab: pathname in this group can be /dashboard, /catalog, /targeting
  const activeTab = NAV_ITEMS.findIndex(
    (item) => pathname === item.href.replace('/(merchant)', '') || pathname === item.href,
  );

  const maxWidth = Math.min(width, 960);
  const centered: object = Platform.OS === 'web'
    ? { width: maxWidth, alignSelf: 'center' }
    : { flex: 1 };

  return (
    <SafeAreaView style={styles.root}>
      {/* ── Header bar ─────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={[styles.headerInner, centered]}>
          <Text style={styles.brand}>Espace magasin</Text>
          {/* Live / Démo indicator */}
          <View style={styles.badge}>
            <View style={[styles.badgeDot, { backgroundColor: isLive ? '#34C759' : colors.ink3 }]} />
            <Text style={styles.badgeLabel}>{isLive ? 'temps réel' : 'démo'}</Text>
          </View>
        </View>
      </View>

      {/* ── Segmented nav ─────────────────────────────────────────────────── */}
      <View style={styles.navBar}>
        <View style={[styles.navInner, centered]}>
          {NAV_ITEMS.map((item, i) => {
            const active = activeTab === i;
            return (
              <Pressable
                key={item.href}
                onPress={() => router.replace(item.href)}
                style={[styles.navPill, active && styles.navPillActive]}
              >
                <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ── Content via nested Stack ───────────────────────────────────────── */}
      <View style={styles.content}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.canvas },
            animation: 'fade',
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  header: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  brand: {
    fontFamily: font.displaySemiBold,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.3,
    color: colors.ink,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.canvas,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeLabel: {
    fontFamily: font.body,
    fontSize: 11,
    color: colors.ink3,
    letterSpacing: 0.2,
  },
  navBar: {
    backgroundColor: colors.surface,
    paddingBottom: 12,
    paddingTop: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  navInner: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 16,
  },
  navPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: 'transparent',
  },
  navPillActive: {
    backgroundColor: colors.ink,
  },
  navLabel: {
    fontFamily: font.bodySemiBold,
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink2,
    letterSpacing: -0.1,
  },
  navLabelActive: {
    color: colors.white,
  },
  content: {
    flex: 1,
  },
});
