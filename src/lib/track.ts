// track.ts — Event Tracker. File locale (toujours) + insert Supabase best-effort.
// Capture le funnel : ouvertures, sélections, intentions, itinéraires, QR/conversions.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupabase } from '@/lib/supabase';
import { hasSupabase } from '@/lib/env';

let deviceId: string | null = null;
async function getDeviceId(): Promise<string> {
  if (deviceId) return deviceId;
  let id = await AsyncStorage.getItem('spotit_device');
  if (!id) {
    id = `dev_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
    await AsyncStorage.setItem('spotit_device', id);
  }
  deviceId = id;
  return id;
}

export interface TrackedEvent { type: string; props: Record<string, any>; ts: string }
const queue: TrackedEvent[] = [];

/** Enregistre un événement (clic, ouverture, intention, QR…). Non bloquant. */
export function track(type: string, props: Record<string, any> = {}): void {
  const evt: TrackedEvent = { type, props, ts: new Date().toISOString() };
  queue.push(evt);
  if (queue.length > 300) queue.shift();
  void flush(evt);
}

async function flush(evt: TrackedEvent): Promise<void> {
  const sb = getSupabase();
  if (!hasSupabase() || !sb) return;
  try {
    const id = await getDeviceId();
    await sb.from('events').insert({ device_id: id, type: evt.type, props: evt.props });
  } catch {
    /* best-effort : la file locale garde la trace */
  }
}

/** Pour debug / un éventuel écran analytics local. */
export function getTrackedEvents(): TrackedEvent[] { return [...queue]; }
