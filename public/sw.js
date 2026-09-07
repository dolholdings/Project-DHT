// Dolphin PWA & Firestore Background Sync Service Worker v5
const CACHE_NAME = 'dolphin-portal-v5';
const SYNC_TAG = 'firestore-sync';
const BROADCAST_CHANNEL_NAME = 'dolphin_cross_tab_sync';

const FIREBASE_CONFIG = {
  projectId: 'gen-lang-client-0765808259',
  apiKey: 'AIzaSyBTCUB_x0-OuhsELNFX01NWZVjs26-o1PA',
  firestoreDatabaseId: 'ai-studio-dolphinglobalhol-4e43647e-ad74-4600-aead-bf0b263ccc53'
};

const DB_NAME = 'dolphin_sw_sync_db';
const DB_VERSION = 1;
const STORE_NAME = 'pending_mutations';

// --- IndexedDB Helper for Background Sync Queue ---
function openSyncDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'queueId', autoIncrement: true });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function addMutationToQueue(mutation) {
  try {
    const db = await openSyncDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const record = {
        ...mutation,
        status: 'pending',
        queuedAt: Date.now(),
        retryCount: 0
      };
      const req = store.add(record);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[SW Sync] Failed to queue mutation in IndexedDB:', err);
    return null;
  }
}

async function getPendingMutations() {
  try {
    const db = await openSyncDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[SW Sync] Failed to retrieve pending mutations:', err);
    return [];
  }
}

async function removeMutationFromQueue(queueId) {
  try {
    const db = await openSyncDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(queueId);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[SW Sync] Failed to delete mutation from queue:', err);
    return false;
  }
}

// --- Cross-Tab / Cross-Session Broadcasting ---
async function broadcastCrossTab(payload, excludeClientId) {
  // 1. BroadcastChannel API
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      bc.postMessage(payload);
      bc.close();
    }
  } catch (e) {}

  // 2. Direct client matchAll postMessage
  try {
    const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
    for (const client of clients) {
      if (excludeClientId && client.id === excludeClientId) continue;
      client.postMessage(payload);
    }
  } catch (e) {}
}

// --- Convert JS Object to Firestore REST Format ---
function valueToFirestoreRest(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(valueToFirestoreRest) } };
  }
  if (typeof val === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) fields[k] = valueToFirestoreRest(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function objectToFirestoreRestFields(data) {
  const fields = {};
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) {
      fields[k] = valueToFirestoreRest(v);
    }
  }
  return fields;
}

// --- Proactive Push to Firestore (REST or Active Client SDK) ---
async function pushMutationToFirestore(mutation) {
  const { collection, action, id, data, authToken } = mutation;
  const dbId = FIREBASE_CONFIG.firestoreDatabaseId;
  const projId = FIREBASE_CONFIG.projectId;
  const apiKey = FIREBASE_CONFIG.apiKey;
  const baseUrl = `https://firestore.googleapis.com/v1/projects/${projId}/databases/${dbId}/documents/${collection}/${id}?key=${apiKey}`;

  const headers = { 'Content-Type': 'application/json' };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  try {
    let response;
    if (action === 'delete') {
      response = await fetch(baseUrl, { method: 'DELETE', headers });
    } else {
      // create or update
      const body = JSON.stringify({ fields: objectToFirestoreRestFields(data || {}) });
      response = await fetch(baseUrl, { method: 'PATCH', headers, body });
    }

    if (response.ok || (action === 'delete' && response.status === 404)) {
      return { success: true };
    }

    // If REST permission denied (e.g. requires SDK auth state), ask an active client window to commit
    const sdkResult = await requestClientSdkSync(mutation);
    if (sdkResult) return { success: true };

    return { success: false, status: response.status };
  } catch (netErr) {
    // Network failure or offline
    const sdkResult = await requestClientSdkSync(mutation);
    return { success: Boolean(sdkResult), error: netErr };
  }
}

async function requestClientSdkSync(mutation) {
  try {
    const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
    if (clients.length === 0) return false;
    for (const client of clients) {
      client.postMessage({
        type: 'EXECUTE_SDK_SYNC_REQUEST',
        mutation
      });
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}

// --- Flush Pending Queue ---
let isFlushing = false;
async function flushPendingQueue() {
  if (isFlushing) return;
  isFlushing = true;
  try {
    const pending = await getPendingMutations();
    if (pending.length === 0) {
      isFlushing = false;
      return;
    }

    for (const item of pending) {
      const res = await pushMutationToFirestore(item);
      if (res.success) {
        if (item.queueId) {
          await removeMutationFromQueue(item.queueId);
        }
        broadcastCrossTab({
          type: 'SW_MUTATION_SYNCED',
          collection: item.collection,
          action: item.action,
          id: item.id
        });
      }
    }
  } catch (err) {
    console.warn('[SW Sync] Queue flush encountered an error:', err);
  } finally {
    isFlushing = false;
  }
}

// --- Service Worker Lifecycle Events ---
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Pass through network requests cleanly without intercepting Firebase / API
self.addEventListener('fetch', (event) => {
  return;
});

// --- Background Sync Event (SyncManager) ---
self.addEventListener('sync', (event) => {
  if (event.tag === SYNC_TAG || event.tag.startsWith('firestore-sync')) {
    event.waitUntil(flushPendingQueue());
  }
});

// --- Periodic Background Sync (if supported) ---
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'firestore-periodic-sync') {
    event.waitUntil(flushPendingQueue());
  }
});

// --- Message Event: Listen for Data Changes from Window Tabs ---
self.addEventListener('message', async (event) => {
  const data = event.data;
  if (!data || typeof data !== 'object') return;

  const clientId = event.source ? event.source.id : undefined;

  switch (data.type) {
    case 'DATA_MUTATION': {
      const mutation = data.payload;
      if (!mutation || !mutation.collection || !mutation.id) return;

      // 1. Immediately broadcast to all other open sessions/tabs for instant zero-latency UI update
      broadcastCrossTab({
        type: 'DATA_CHANGED_BROADCAST',
        collection: mutation.collection,
        action: mutation.action,
        id: mutation.id,
        data: mutation.data,
        timestamp: mutation.timestamp || Date.now(),
        senderId: mutation.senderId || clientId
      }, clientId);

      // 2. Queue in IndexedDB so changes survive browser closure/offline states
      const queueId = await addMutationToQueue(mutation);
      mutation.queueId = queueId;

      // 3. Proactively push to Firestore
      const res = await pushMutationToFirestore(mutation);
      if (res.success && queueId) {
        await removeMutationFromQueue(queueId);
        broadcastCrossTab({
          type: 'SW_MUTATION_SYNCED',
          collection: mutation.collection,
          action: mutation.action,
          id: mutation.id
        });
      }
      break;
    }

    case 'TRIGGER_SYNC_QUEUE': {
      await flushPendingQueue();
      break;
    }

    case 'SDK_SYNC_COMPLETED': {
      if (data.queueId) {
        await removeMutationFromQueue(data.queueId);
      }
      break;
    }

    case 'PING': {
      if (event.source) {
        event.source.postMessage({ type: 'PONG', time: Date.now() });
      }
      break;
    }
  }
});
