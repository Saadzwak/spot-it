// MapWebView.tsx — wrapper RN autour de Mapbox GL JS (WebView).
// Sans token `pk.` : affiche un fallback stylé (pas de crash, M0 reste vert).
import React, { useMemo, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import type { Offer } from '@/types/contracts';
import { colors, categories } from '@/design/tokens';
import { ENV, hasMapbox } from '@/lib/env';
import { DEMO_USER } from '@/data/offers.seed';
import { buildMapHtml, type MapMarker } from './mapHtml';

function initials(brand: string): string {
  return brand.split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase();
}

function toMarkers(offers: Offer[]): MapMarker[] {
  return offers
    .filter((o) => o.lat != null && o.lng != null)
    .map((o) => ({
      id: o.id, lat: o.lat as number, lng: o.lng as number,
      initials: initials(o.brand),
      color: (categories as any)[o.category]?.hue ?? colors.accent,
      sponsored: o.sponsored,
    }));
}

export interface MapWebViewProps {
  offers: Offer[];
  center?: { lat: number; lng: number };
  onSelectOffer?: (offerId: string) => void;
}

export function MapWebView({ offers, center = DEMO_USER, onSelectOffer }: MapWebViewProps) {
  const ref = useRef<WebView>(null);
  const html = useMemo(
    () => buildMapHtml({ token: ENV.mapboxToken, style: ENV.mapboxStyle, center, markers: toMarkers(offers) }),
    [offers, center],
  );

  if (!hasMapbox()) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackTitle}>Carte</Text>
        <Text style={styles.fallbackBody}>
          Ajoute <Text style={styles.code}>EXPO_PUBLIC_MAPBOX_TOKEN</Text> (clé pk.) dans .env pour activer la carte Mapbox.
        </Text>
        <View style={styles.bubbleRow}>
          {toMarkers(offers).slice(0, 6).map((m) => (
            <View key={m.id} style={[styles.bubble, { backgroundColor: m.color }]}>
              <Text style={styles.bubbleTxt}>{m.initials}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  const onMessage = (e: WebViewMessageEvent) => {
    try {
      const d = JSON.parse(e.nativeEvent.data);
      if (d?.type === 'select' && d.offerId) onSelectOffer?.(d.offerId);
    } catch {
      /* ignore */
    }
  };

  return (
    <WebView
      ref={ref}
      originWhitelist={['*']}
      source={{ html }}
      onMessage={onMessage}
      style={styles.web}
      javaScriptEnabled
      domStorageEnabled
      setSupportMultipleWindows={false}
    />
  );
}

const styles = StyleSheet.create({
  web: { flex: 1, backgroundColor: colors.canvas },
  fallback: { flex: 1, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 14 },
  fallbackTitle: { fontSize: 22, fontWeight: '700', color: colors.ink },
  fallbackBody: { fontSize: 14, color: colors.ink2, textAlign: 'center', lineHeight: 20 },
  code: { color: colors.accentInk, fontWeight: '700' },
  bubbleRow: { flexDirection: 'row', gap: 10, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' },
  bubble: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff' },
  bubbleTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
});

export default MapWebView;
