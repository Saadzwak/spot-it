// MapWebView.tsx — wrapper RN autour de Mapbox GL JS (2D + itinéraire).
// Sans token `pk.` : fallback stylé (pas de crash).
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
      id: o.id, lat: o.lat as number, lng: o.lng as number, image: o.image,
      initials: initials(o.brand),
      color: (categories as any)[o.category]?.hue ?? colors.accent,
      sponsored: o.sponsored,
    }));
}

export interface MapEta { offerId: string; durationMin?: number; distanceM?: number; error?: string }
export interface MapWebViewProps {
  offers: Offer[];
  center?: { lat: number; lng: number };
  routeTo?: { id: string; lat: number; lng: number } | null;
  onSelectOffer?: (offerId: string) => void;
  onEta?: (e: MapEta) => void;
}

export function MapWebView({ offers, center = DEMO_USER, routeTo, onSelectOffer, onEta }: MapWebViewProps) {
  const ref = useRef<WebView>(null);
  const ready = useRef(false);
  const html = useMemo(
    () => buildMapHtml({ token: ENV.mapboxToken, style: ENV.mapboxStyle, center, markers: toMarkers(offers) }),
    [offers, center],
  );

  const sendRoute = () => {
    if (!ready.current) return;
    if (routeTo) ref.current?.postMessage(JSON.stringify({ type: 'route', lng: routeTo.lng, lat: routeTo.lat, offerId: routeTo.id }));
    else ref.current?.postMessage(JSON.stringify({ type: 'clearRoute' }));
  };
  useEffect(sendRoute, [routeTo]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!hasMapbox()) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackTitle}>Carte</Text>
        <Text style={styles.fallbackBody}>Ajoute <Text style={styles.code}>EXPO_PUBLIC_MAPBOX_TOKEN</Text> (pk.) dans .env.</Text>
      </View>
    );
  }

  const onMessage = (e: WebViewMessageEvent) => {
    try {
      const d = JSON.parse(e.nativeEvent.data);
      if (d?.type === 'ready') { ready.current = true; sendRoute(); }
      else if (d?.type === 'select' && d.offerId) onSelectOffer?.(d.offerId);
      else if (d?.type === 'eta') onEta?.(d as MapEta);
    } catch { /* ignore */ }
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
  fallback: { flex: 1, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 10 },
  fallbackTitle: { fontSize: 22, fontWeight: '700', color: colors.ink },
  fallbackBody: { fontSize: 14, color: colors.ink2, textAlign: 'center', lineHeight: 20 },
  code: { color: colors.accentInk, fontWeight: '700' },
});

export default MapWebView;
