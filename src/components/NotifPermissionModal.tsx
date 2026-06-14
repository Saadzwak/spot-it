// NotifPermissionModal — bottom sheet contextuel montré ~1 s après la 1re
// recherche, pour mettre en valeur LA feature clé : être alerté en passant près
// d'un magasin qui a un produit pour soi. Déclenche la vraie permission iOS au tap.
import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { colors, font, text, shadows } from '@/design/theme';
import { PrimaryButton } from './Primitives';
import { Icon } from './Icon';

export function NotifPermissionModal({
  visible, onEnable, onLater,
}: { visible: boolean; onEnable: () => void; onLater: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onLater} statusBarTranslucent>
      <Animated.View entering={FadeIn.duration(220)} style={styles.backdrop}>
        <Animated.View entering={FadeInUp.duration(380)} style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.badge}><Icon name="bell" size={28} color={colors.accent} /></View>
          <Text style={styles.title}>Ne rate plus une offre{'\n'}à côté de toi</Text>
          <Text style={styles.body}>
            Reçois une alerte quand tu passes près d'une boutique qui a un produit pour toi —
            choisi selon ton profil. Sans ouvrir l'app, sans rien chercher.
          </Text>
          <View style={styles.actions}>
            <PrimaryButton label="Activer les notifications" onPress={onEnable} icon={<Icon name="bell" size={18} color="#fff" />} />
            <Pressable onPress={onLater} hitSlop={8} style={styles.later}>
              <Text style={styles.laterTxt}>Plus tard</Text>
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(23,19,15,0.55)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 26, paddingTop: 14, paddingBottom: 38, gap: 12, alignItems: 'center', ...shadows.card,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.line, marginBottom: 8 },
  badge: { width: 64, height: 64, borderRadius: 20, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  title: { fontFamily: font.displayBold, fontSize: 23, lineHeight: 28, color: colors.ink, textAlign: 'center', letterSpacing: -0.5 },
  body: { ...text.body, textAlign: 'center', maxWidth: 330 },
  actions: { alignSelf: 'stretch', gap: 6, marginTop: 6 },
  later: { alignSelf: 'center', paddingVertical: 10 },
  laterTxt: { fontFamily: font.bodySemiBold, fontSize: 15, color: colors.ink3 },
});

export default NotifPermissionModal;
