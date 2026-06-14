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

export interface RouteStep { instruction: string; distanceM: number; type?: string; modifier?: string; name?: string }
export interface MapEta { offerId: string; durationMin?: number; distanceM?: number; error?: string; steps?: RouteStep[] }
export interface MapWebViewProps {
  offers: Offer[];
  center?: { lat: number; lng: number };
  routeTo?: { id: string; lat: number; lng: number } | null;
  overviewSignal?: number; // incrémenter pour cadrer TOUT le tracé (vue d'ensemble)
  onSelectOffer?: (offerId: string) => void;
  onEta?: (e: MapEta) => void;
}

export function MapWebView({ offers, center = DEMO_USER, routeTo, overviewSignal, onSelectOffer, onEta }: MapWebViewProps) {
  const ref = useRef<WebView>(null);
  const ready = useRef(false);
  // On NE reconstruit le HTML que si les marqueurs changent (pas à chaque jitter
  // GPS) — sinon la WebView se recharge et la carte se fige. Le recentrage léger
  // passe par un message 'recenter', pas par un rebuild.
  const centerKey = `${center.lat.toFixed(4)},${center.lng.toFixed(4)}`;
  const html = useMemo(
    () => buildMapHtml({ token: ENV.mapboxToken, style: ENV.mapboxStyle, center, markers: toMarkers(offers) }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [offers],
  );

  const sendRoute = () => {
    if (!ready.current) return;
    if (routeTo) ref.current?.postMessage(JSON.stringify({ type: 'route', lng: routeTo.lng, lat: routeTo.lat, offerId: routeTo.id }));
    else ref.current?.postMessage(JSON.stringify({ type: 'clearRoute' }));
  };
  // deps = l'ID de l'offre (primitif), PAS l'objet routeTo qui change de référence
  // à chaque render → évite le spam de flyTo qui empêchait de bouger la carte.
  useEffect(sendRoute, [routeTo?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Recentre la carte quand la vraie position arrive, sans recharger la WebView.
  useEffect(() => {
    if (!ready.current) return;
    ref.current?.postMessage(JSON.stringify({ type: 'recenter', lng: center.lng, lat: center.lat }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centerKey]);

  // Vue d'ensemble du tracé (déclenchée quand l'utilisateur demande l'itinéraire).
  useEffect(() => {
    if (ready.current && overviewSignal) ref.current?.postMessage(JSON.stringify({ type: 'fitRoute' }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overviewSignal]);

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
