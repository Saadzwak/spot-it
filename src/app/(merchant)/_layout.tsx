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
import { Stack, usePathname, router, Redirect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, shadows } from '@/design/tokens';
import { font } from '@/design/theme';
import { hasSupabase } from '@/lib/env';
import { useMerchantSession } from '@/merchant/useMerchantData';
import { Icon } from '@/components';

const NAV_ITEMS = [
  { label: 'Dashboard',  href: '/(merchant)/dashboard'  },
  { label: 'Audience',   href: '/(merchant)/audience'   },
  { label: 'Catalogue',  href: '/(merchant)/catalog'    },
  { label: 'Ciblage',    href: '/(merchant)/targeting'  },
] as const;

export default function MerchantLayout() {
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const isLive = hasSupabase();
  const { session, loading: sessionLoading, live, signOut } = useMerchantSession();

  const isLogin = pathname.endsWith('/login');

  // Gating réel : pas de session → écran de connexion. En démo, session pré-remplie.
  if (live && !sessionLoading && !session && !isLogin) {
    return <Redirect href="/(merchant)/login" />;
  }

  // Largeur 100 % plafonnée à 960 et centrée — sur natif comme web.
  // ⚠️ NE PAS utiliser flex:1 (effondre la hauteur dans un parent auto-height)
  // ni width:maxWidth seul (si la mesure vaut 0 au 1er rendu, tout s'effondre).
  const centered: object = { width: '100%', maxWidth: 960, alignSelf: 'center' };

  const stack = (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.canvas },
        animation: 'fade',
      }}
    />
  );

  // L'écran de login s'affiche sans chrome (header + nav).
  if (isLogin) {
    return <View style={styles.root}>{stack}</View>;
  }

  const activeTab = NAV_ITEMS.findIndex(
    (item) => pathname === item.href.replace('/(merchant)', '') || pathname === item.href,
  );

  return (
    <SafeAreaView style={styles.root}>
      {/* ── Header bar ─────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={[styles.headerInner, centered]}>
          <View style={styles.headerLeft}>
            <Pressable
              onPress={() => {
                if (router.canGoBack()) router.back();
                else router.replace('/(tabs)/profile');
              }}
              hitSlop={10}
              style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
              accessibilityLabel="Retour à l’application"
            >
              <Icon name="chevronLeft" size={20} color={colors.ink} />
            </Pressable>
            <Text style={styles.brand}>Espace magasin</Text>
          </View>
          {/* Live / Démo indicator + déconnexion */}
          <View style={styles.headerRight}>
            <View style={styles.badge}>
              <View style={[styles.badgeDot, { backgroundColor: isLive ? '#34C759' : colors.ink3 }]} />
              <Text style={styles.badgeLabel}>{isLive ? 'temps réel' : 'démo'}</Text>
            </View>
            {live && session && !session.demo && (
              <Pressable
                onPress={() => { void signOut(); router.replace('/(merchant)/login'); }}
                hitSlop={8}
                style={({ pressed }) => [styles.logoutBtn, pressed && styles.backBtnPressed]}
                accessibilityLabel="Se déconnecter"
              >
                <Text style={styles.logoutLabel}>Déconnexion</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>

      {/* ── Segmented nav (contrôle unifié) ────────────────────────────────── */}
      <View style={styles.navBar}>
        <View style={[styles.navOuter, centered]}>
          <View style={styles.navTrack}>
            {NAV_ITEMS.map((item, i) => {
              const active = activeTab === i;
              return (
                <Pressable
                  key={item.href}
                  onPress={() => router.replace(item.href)}
                  style={({ pressed }) => [
                    styles.navSeg,
                    active && styles.navSegActive,
                    pressed && !active && styles.navSegPressed,
                  ]}
                >
                  <Text
                    numberOfLines={1}
                    style={[styles.navLabel, active && styles.navLabelActive]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      {/* ── Content via nested Stack ───────────────────────────────────────── */}
      <View style={styles.content}>{stack}</View>
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -6,
    backgroundColor: colors.canvas,
  },
  backBtnPressed: {
    opacity: 0.6,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.canvas,
  },
  logoutLabel: {
    fontFamily: font.bodySemiBold,
    fontSize: 12,
    fontWeight: '600',
    color: colors.ink2,
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
  navOuter: {
    paddingHorizontal: 16,
  },
  navTrack: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    width: '100%',
    backgroundColor: colors.canvas,
    borderRadius: radius.pill,
    padding: 4,
    gap: 2,
  },
  navSeg: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderRadius: radius.pill,
  },
  navSegActive: {
    backgroundColor: colors.ink,
  },
  navSegPressed: {
    opacity: 0.55,
  },
  navLabel: {
    fontFamily: font.bodySemiBold,
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink2,
    letterSpacing: -0.1,
    textAlign: 'center',
  },
  navLabelActive: {
    color: colors.white,
  },
  content: {
    flex: 1,
  },
});
