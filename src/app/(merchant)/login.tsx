// ============================================================================
// Login marchand — sobre. Mode démo : entrée directe (session pré-remplie).
// Mode réel : connexion email/mot de passe (compte démo seedé pré-rempli).
// ============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, shadows } from '@/design/tokens';
import { font } from '@/design/theme';
import { PrimaryButton, SpotLogo } from '@/components';
import { useMerchantSession } from '@/merchant/useMerchantData';

export default function MerchantLogin(): React.ReactElement {
  const { live, signIn } = useMerchantSession();
  const { width } = useWindowDimensions();
  const cardWidth = Platform.OS === 'web' ? Math.min(width - 32, 420) : undefined;

  const [email, setEmail] = useState('merchant@demo.spotit');
  const [password, setPassword] = useState('demo1234');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const goDashboard = () => router.replace('/(merchant)/dashboard');

  const handleSignIn = async () => {
    if (busy) return;
    setBusy(true); setError(null);
    const { error: e } = await signIn(email.trim(), password);
    setBusy(false);
    if (e) setError(e);
    else goDashboard();
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={[styles.card, cardWidth ? { width: cardWidth } : undefined]}>
        <SpotLogo />
        <Text style={styles.title}>Espace magasin</Text>
        <Text style={styles.sub}>
          {live
            ? 'Connectez-vous pour gérer vos offres et campagnes.'
            : 'Mode démonstration — explorez le tableau de bord sans compte.'}
        </Text>

        {live ? (
          <>
            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor={colors.ink3}
              style={styles.input}
            />
            <Text style={styles.label}>Mot de passe</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor={colors.ink3}
              style={styles.input}
            />
            {error && <Text style={styles.error}>{error}</Text>}
            <View style={styles.cta}>
              <PrimaryButton label={busy ? 'Connexion…' : 'Se connecter'} onPress={handleSignIn} disabled={busy} />
            </View>
          </>
        ) : (
          <View style={styles.cta}>
            <PrimaryButton label="Entrer dans l’espace magasin" onPress={goDashboard} />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center', padding: 16 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.sheet,
    padding: 28,
    gap: 4,
    alignSelf: 'stretch',
    ...shadows.card,
  },
  title: {
    fontFamily: font.displayBold,
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.6,
    color: colors.ink,
    marginTop: 16,
  },
  sub: { fontFamily: font.body, fontSize: 14, color: colors.ink3, lineHeight: 20, marginBottom: 8 },
  label: {
    fontFamily: font.bodySemiBold,
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink2,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginTop: 14,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.canvas,
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderColor: colors.line,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: font.body,
    fontSize: 15,
    color: colors.ink,
  },
  error: { fontFamily: font.body, fontSize: 13, color: colors.accentInk, marginTop: 10 },
  cta: { marginTop: 22 },
});
