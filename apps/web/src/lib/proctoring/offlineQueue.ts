/**
 * Client-Side Offline Event Queue for Network Resilience.
 * Caches proctoring events & snapshots locally if offline, and drains them when reconnected.
 */

export interface QueuedProctorEvent {
  id: string;
  contestId: string;
  type: string;
  severity?: string;
  startedAt: string;
  endedAt?: string;
  durationSec: number;
  confidence: number;
  metadata?: any;
  snapshotBase64?: string;
  timestamp: number;
}

const STORAGE_KEY = "codeproctor_offline_events_v1";

export function enqueueOfflineEvent(event: Omit<QueuedProctorEvent, "id" | "timestamp">) {
  if (typeof window === "undefined") return;

  const item: QueuedProctorEvent = {
    ...event,
    id: `offline_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
  };

  try {
    const existingRaw = localStorage.getItem(STORAGE_KEY);
    const list: QueuedProctorEvent[] = existingRaw ? JSON.parse(existingRaw) : [];
    
    // Cap to 25 items to prevent overflowing storage
    if (list.length >= 25) {
      list.shift();
    }
    list.push(item);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn("[OfflineQueue] Failed to enqueue event:", err);
  }
}

export function getQueuedOfflineEvents(): QueuedProctorEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearQueuedOfflineEvents() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export async function flushOfflineQueue(
  sendFn: (event: QueuedProctorEvent) => Promise<boolean>
): Promise<number> {
  if (typeof window === "undefined" || !navigator.onLine) return 0;

  const events = getQueuedOfflineEvents();
  if (events.length === 0) return 0;

  const remaining: QueuedProctorEvent[] = [];
  let flushedCount = 0;

  for (const ev of events) {
    try {
      const ok = await sendFn(ev);
      if (ok) {
        flushedCount++;
      } else {
        remaining.push(ev);
      }
    } catch {
      remaining.push(ev);
    }
  }

  try {
    if (remaining.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {}

  return flushedCount;
}
