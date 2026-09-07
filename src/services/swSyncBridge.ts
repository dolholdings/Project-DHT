/**
 * Service Worker & Cross-Tab Realtime Background Sync Bridge
 * Connects window tabs to sw.js for background synchronization with Firestore
 */

import { auth, db } from '../lib/firebase';
import { doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

export interface DataMutationPayload {
  collection: string;
  action: 'create' | 'update' | 'delete';
  id: string;
  data?: any;
  timestamp?: number;
  senderId?: string;
  authToken?: string;
  queueId?: number;
}

const BROADCAST_CHANNEL_NAME = 'dolphin_cross_tab_sync';
const TAB_SESSION_ID = `tab_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;

type CrossTabChangeCallback = (mutation: DataMutationPayload) => void;
const changeListeners = new Set<CrossTabChangeCallback>();

let broadcastChannel: BroadcastChannel | null = null;
let isInitialized = false;

/**
 * Initialize the Service Worker Background Sync Bridge
 */
export function initSwSyncBridge() {
  if (isInitialized || typeof window === 'undefined') return;
  isInitialized = true;

  // 1. Initialize BroadcastChannel for instant cross-tab communication
  try {
    if ('BroadcastChannel' in window) {
      broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      broadcastChannel.onmessage = (event) => {
        handleIncomingSyncMessage(event.data);
      };
    }
  } catch (e) {
    console.warn('[SW Sync Bridge] BroadcastChannel not supported:', e);
  }

  // 2. Listen to postMessage from Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      handleIncomingSyncMessage(event.data);
    });

    // When connection is restored, trigger SW to flush pending queue
    window.addEventListener('online', () => {
      triggerSwQueueFlush();
    });
  }
}

/**
 * Handle incoming cross-tab and service worker synchronization messages
 */
async function handleIncomingSyncMessage(data: any) {
  if (!data || typeof data !== 'object') return;

  // Case 1: Data changed in another tab / session
  if (data.type === 'DATA_CHANGED_BROADCAST') {
    if (data.senderId === TAB_SESSION_ID) return; // Ignore own echoes
    const mutation: DataMutationPayload = {
      collection: data.collection,
      action: data.action,
      id: data.id,
      data: data.data,
      timestamp: data.timestamp,
      senderId: data.senderId
    };
    changeListeners.forEach((fn) => {
      try {
        fn(mutation);
      } catch (err) {
        console.warn('[SW Sync Bridge] Listener error:', err);
      }
    });
  }

  // Case 2: Service worker requests active client to execute mutation with Firebase SDK
  if (data.type === 'EXECUTE_SDK_SYNC_REQUEST' && data.mutation) {
    const m = data.mutation as DataMutationPayload;
    try {
      const docRef = doc(db, m.collection, m.id);
      if (m.action === 'delete') {
        await deleteDoc(docRef);
      } else if (m.action === 'create') {
        await setDoc(docRef, m.data || {}, { merge: true });
      } else {
        await updateDoc(docRef, m.data || {});
      }

      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SDK_SYNC_COMPLETED',
          queueId: m.queueId
        });
      }
    } catch (err) {
      console.warn('[SW Sync Bridge] SDK execution failed:', err);
    }
  }
}

/**
 * Subscribe to cross-tab data changes for instant UI state update
 */
export function onCrossTabDataChange(callback: CrossTabChangeCallback): () => void {
  changeListeners.add(callback);
  return () => {
    changeListeners.delete(callback);
  };
}

/**
 * Proactively notify the Service Worker and other tabs of a data mutation
 */
export async function notifySwDataChange(
  collection: string,
  action: 'create' | 'update' | 'delete',
  id: string,
  data?: any
) {
  if (typeof window === 'undefined') return;

  let authToken: string | undefined;
  try {
    if (auth.currentUser) {
      authToken = await auth.currentUser.getIdToken();
    }
  } catch (_) {}

  const payload: DataMutationPayload = {
    collection,
    action,
    id,
    data,
    timestamp: Date.now(),
    senderId: TAB_SESSION_ID,
    authToken
  };

  // 1. Send to BroadcastChannel for instant zero-latency cross-tab update
  try {
    if (broadcastChannel) {
      broadcastChannel.postMessage({
        type: 'DATA_CHANGED_BROADCAST',
        ...payload
      });
    }
  } catch (_) {}

  // 2. Send to Service Worker controller for background queueing & Firestore push
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'DATA_MUTATION',
      payload
    });
  }

  // 3. Register Background Sync with the browser's SyncManager if available
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((reg: any) => {
        if ('sync' in reg) {
          return reg.sync.register('firestore-sync');
        }
      })
      .catch(() => {});
  }
}

/**
 * Force the Service Worker to flush any pending offline mutations
 */
export function triggerSwQueueFlush() {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'TRIGGER_SYNC_QUEUE'
    });
  }
}
