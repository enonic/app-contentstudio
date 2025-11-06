import {BaseDeepMap, DeepMapStore, MapStore, StoreValue, WritableAtom} from 'nanostores';
import {createThrottle} from './functions';
import {normalize} from './text';

type StorageType = 'local' | 'session';

type WritableStore = WritableAtom | MapStore | DeepMapStore<BaseDeepMap>;

type SyncOptions<S extends WritableStore, V extends StoreValue<S> = StoreValue<S>> = {
    encode?: (data: V) => string;
    decode?: (raw: string) => V;
    throttleMs?: number;
    storageType?: StorageType;
    loadInitial?: boolean;
    syncTabs?: boolean;
};

type SyncMapOptions<M extends Record<string, unknown>> = {
    keys?: (keyof M)[];
} & Omit<SyncOptions<MapStore<M>, M>, 'encode' | 'decode'>;

/**
 * Synchronizes a Nanostores store with browser storage (localStorage or sessionStorage).
 *
 * This utility sets up bidirectional synchronization between the store and browser storage:
 * - Writes store changes to storage with optimized throttling (leading + trailing edge)
 * - Optionally loads initial value from storage into the store
 * - Optionally syncs changes from other tabs/windows (localStorage only)
 * - Automatically flushes pending writes on page unload/visibility change
 *
 * **Important:** The store is the single source of truth. Use `store.get()` and `store.set()`
 * for all data operations. The returned cleanup function only handles synchronization cleanup.
 *
 * **Write Strategy (No Updates Lost):**
 * - First change: written immediately (users see instant persistence)
 * - Rapid changes: batched during throttle period (performance)
 * - Final value: ALWAYS written after changes settle (data integrity)
 * - Page close: pending writes flushed automatically (reliability)
 *
 * **Features:**
 * - Storage quota exceeded handling with specific error messages
 * - Cross-tab synchronization via Storage API events
 * - Custom serialization/deserialization via encode/decode
 * - Partial store syncing via custom encode/decode functions
 * - Automatic cleanup on unsync
 * - Storage availability detection (handles incognito mode)
 * - Full store value syncing (atom: entire value, map: entire object)
 *
 * **Usage Recommendations:**
 * - Use `localStorage` for user preferences that should persist across sessions
 * - Use `sessionStorage` for temporary UI state that should clear on tab close
 * - Set `loadInitial: true` when you want to restore saved values on page load
 * - Set `syncTabs: true` for multi-tab consistency (e.g., theme, language)
 * - Use custom encode/decode for partial syncing or data transformation
 * - Use lower `throttleMs` (50-100ms) for critical data, higher (200-500ms) for less critical
 * - Call the returned cleanup function when component unmounts to prevent memory leaks
 * - Pass `true` to cleanup function to also clear the storage entry
 *
 * @example
 * // Example 1: Atom store - sync entire value
 * import { atom } from 'nanostores';
 * const counter = atom(0);
 * const unsync = syncStore(counter, 'count', {
 *     loadInitial: true  // Restores saved count
 * });
 * counter.set(5); // Syncs automatically
 * unsync(); // Cleanup when done
 *
 * @example
 * // Example 2: Map store - sync entire map
 * import { map } from 'nanostores';
 * const settings = map({ theme: 'light', lang: 'en' });
 * const unsync = syncStore(settings, 'settings', {
 *     loadInitial: true,
 *     syncTabs: true
 * });
 * settings.set({ theme: 'dark', lang: 'en' }); // Full map syncs
 * unsync(true); // Cleanup and clear storage
 *
 * @example
 * // Example 3: Partial sync with custom encode/decode
 * const settings = map({ theme: 'light', lang: 'en', tempData: {} });
 * const unsync = syncStore(settings, 'settings', {
 *     encode: (data) => JSON.stringify({
 *         theme: data.theme,
 *         lang: data.lang
 *     }), // Only persist theme & lang
 *     decode: (raw) => {
 *         const partial = JSON.parse(raw);
 *         const current = settings.get();
 *         return { ...current, ...partial }; // Merge with current
 *     },
 *     loadInitial: true
 * });
 * unsync(); // Cleanup when done
 *
 * @param store      Writable Nanostores store (atom or map).
 * @param storeName  Logical name for the storage key (will be normalized).
 * @param options
 *   - encode:         Custom function to serialize store value (default: JSON.stringify).
 *   - decode:         Custom function to parse stored value (default: JSON.parse).
 *   - throttleMs:     Write throttle delay in ms (default: 100).
 *   - storageType:    'local' or 'session' (default: 'local').
 *   - loadInitial:    Load value from storage into store on initialization (default: false).
 *   - syncTabs:       Sync changes from other tabs (localStorage only, default: false).
 *
 * @returns Cleanup function. Call with no argument to cleanup. Call with `true` to also clear storage.
 */
export function syncStore<S extends WritableStore, V extends StoreValue<S> = StoreValue<S>>(
    store: S,
    storeName: string,
    options: SyncOptions<S, V> = {}
): (clearStorage?: boolean) => void {
    const {
        throttleMs = 100,
        encode = (data: V): string => JSON.stringify(data),
        decode = (raw: string): V => JSON.parse(raw) as V,
        storageType = 'local',
        loadInitial = false,
        syncTabs = false,
    } = options;

    // Validate storage availability
    const storage = getStorage(storageType);
    if (!storage) {
        console.warn(`${storageType}Storage is not available. Store sync will not work.`);
        return createNoopSync();
    }

    // Validate store name
    const normalizedKey = normalize(storeName);
    if (!normalizedKey) {
        console.error(`Invalid store name: "${storeName}". Store sync will not work.`);
        return createNoopSync();
    }

    const storageKey = getStorageKey(normalizedKey);

    // Get and set helper functions
    const getFromStorage = (): V | undefined => {

        try {
            const raw = storage.getItem(storageKey);
            if (!raw) return undefined;
            console.log(`getFromStorage <${storageKey}>: ${raw}`);
            return decode(raw);
        } catch (error: unknown) {
            console.error(`Error getting value from ${storageType}Storage ${storageKey}`, error);
            return undefined;
        }
    };

    const writeToStorage = (value: V): void => {
        try {
            storage.setItem(storageKey, encode(value));
            console.log(`writeToStorage <${storageKey}>: ${encode(value)}`);
        } catch (error: unknown) {
            if (isQuotaExceededError(error)) {
                console.error(`${storageType}Storage quota exceeded for ${storageKey}`, error);
            } else {
                console.error(`Error writing to ${storageType}Storage ${storageKey}`, error);
            }
        }
    };

    const removeFromStorage = (): void => {
        try {
            storage.removeItem(storageKey);
            console.log(`removeFromStorage <${storageKey}>`);
        } catch (error: unknown) {
            console.error(`Error removing from ${storageType}Storage ${storageKey}`, error);
        }
    };

    // Throttled write handler for store changes
    const throttledWrite = createThrottle((value: V, oldValue: V | undefined): void => {
        try {
            if (value !== undefined) {
                console.log(`throttledWrite <${storageKey}>: ${encode(value)}`);
                writeToStorage(value);
            } else {
                removeFromStorage();
            }
        } catch (error: unknown) {
            console.error(`Error syncing store with ${storageType}Storage ${storageKey}`, error);
        }
    }, throttleMs);

    if (loadInitial) {
        const initialValue = getFromStorage();
        if (initialValue !== undefined && 'set' in store) {
            try {
                store.set(initialValue);
            } catch (error: unknown) {
                console.error(`Error loading initial value from ${storageType}Storage`, error);
            }
        }
    }

    const unsubscribe = store.listen(throttledWrite);

    // Cross-tab synchronization (localStorage only)
    let storageListener: ((e: StorageEvent) => void) | null = null;
    if (syncTabs && storageType === 'local') {
        storageListener = (e: StorageEvent) => {
            if (e.key === storageKey && e.newValue !== null && 'set' in store) {
                try {
                    const newValue = decode(e.newValue);
                    store.set(newValue);
                } catch (error: unknown) {
                    console.error(`Error syncing from other tab for ${storageKey}`, error);
                }
            }
        };
        window.addEventListener('storage', storageListener);
    }

    // Flush on page visibility change (tab close, navigation, etc.)
    // This ensures pending writes are not lost when user leaves the page
    const visibilityListener = (): void => {
        if (document.visibilityState === 'hidden') {
            throttledWrite.flush();
        }
    };
    document.addEventListener('visibilitychange', visibilityListener);

    // Flush on beforeunload as final safety net
    const beforeUnloadListener = () => {
        throttledWrite.flush();
    };
    window.addEventListener('beforeunload', beforeUnloadListener);

    return (clearStorage?: boolean) => {
        try {
            // Flush any pending writes to ensure final state is saved
            throttledWrite.flush();
            unsubscribe();

            // Clean up all event listeners
            if (storageListener) {
                window.removeEventListener('storage', storageListener);
                storageListener = null;
            }
            document.removeEventListener('visibilitychange', visibilityListener);
            window.removeEventListener('beforeunload', beforeUnloadListener);

            // Optionally clear storage
            if (clearStorage) {
                removeFromStorage();
            }
        } catch (error: unknown) {
            console.error(`Error unsyncing from store ${storeName}`, error);
        }
    };
}

/**
 * Convenience wrapper for syncing MapStore with optional partial key syncing.
 *
 * This function simplifies the common pattern of syncing only specific keys from a map store.
 * It automatically generates encode/decode functions based on the keys you want to sync.
 *
 * **Key Features:**
 * - Sync entire map when `keys` is undefined or empty array
 * - Sync only specific keys when `keys` array has values
 * - Automatic merging: partial data is merged with current store values on decode
 * - All standard `syncStore` features: throttling, cross-tab sync, page unload protection
 *
 * **When to Use:**
 * - You have a map store with multiple properties
 * - You only want to persist some properties (e.g., user preferences, not temporary UI state)
 * - You want automatic merge behavior when loading from storage
 *
 * @example
 * // Example 1: Sync entire map (no keys specified)
 * import { map } from 'nanostores';
 * const settings = map({ theme: 'light', lang: 'en', tempData: {} });
 * const unsync = syncMapStore(settings, 'settings', {
 *     loadInitial: true
 * });
 * // All keys synced: theme, lang, tempData
 *
 * @example
 * // Example 2: Sync only specific keys
 * const settings = map({ theme: 'light', lang: 'en', tempData: {} });
 * const unsync = syncMapStore(settings, 'user-prefs', {
 *     keys: ['theme', 'lang'],  // Only persist theme and lang
 *     loadInitial: true,
 *     syncTabs: true
 * });
 * settings.setKey('theme', 'dark');     // Syncs to storage
 * settings.setKey('tempData', {...});   // NOT synced (not in keys)
 *
 * @example
 * // Example 3: Empty array means sync all keys
 * const unsync = syncMapStore(settings, 'settings', {
 *     keys: [],  // Same as not specifying keys
 *     loadInitial: true
 * });
 *
 * @param store      MapStore to synchronize
 * @param storeName  Logical name for the storage key (will be normalized)
 * @param options
 *   - keys:           Array of keys to sync. Undefined or [] = sync all keys
 *   - throttleMs:     Write throttle delay in ms (default: 100)
 *   - storageType:    'local' or 'session' (default: 'local')
 *   - loadInitial:    Load value from storage into store on initialization (default: false)
 *   - syncTabs:       Sync changes from other tabs (localStorage only, default: false)
 *
 * @returns Cleanup function. Call with no argument to cleanup. Call with `true` to also clear storage.
 */
export function syncMapStore<M extends Record<string, unknown>>(
    store: MapStore<M>,
    storeName: string,
    options: SyncMapOptions<M> = {}
): (clearStorage?: boolean) => void {
    const {keys, ...syncOptions} = options;

    const isPartialSync = keys !== undefined && keys.length > 0;

    const encode = isPartialSync
        ? (data: M): string => {
              const partial: Partial<M> = {};
              for (const key of keys) {
                  if (key in data) {
                      partial[key] = data[key];
                  }
              }
              return JSON.stringify(partial);
          }
        : (data: M): string => JSON.stringify(data);

    const decode = isPartialSync
        ? (raw: string): M => {
              const partial = JSON.parse(raw) as Partial<M>;
              const current = store.get();
              return {...current, ...partial};
          }
        : (raw: string): M => JSON.parse(raw) as M;

    return syncStore(store, storeName, {
        ...syncOptions,
        encode,
        decode,
    });
}

//
// * Utilities
//

/**
 * Create a key for the current application's storage.
 * The key is prefixed with 'enonic:cs:' to avoid conflicts with other applications.
 */
function getStorageKey(normalizedKey: string): string {
    return 'enonic:cs:' + normalizedKey;
}

// Cache storage availability to avoid repeated tests
const storageCache = new Map<StorageType, Storage | null>();

/**
 * Gets storage instance with availability check and caching.
 * Tests are performed only once per storage type to optimize performance.
 * Storage can be unavailable in:
 * - Private/incognito browsing mode
 * - Browser settings that disable storage
 * - Server-side rendering contexts
 * - Storage quota is completely full
 */
function getStorage(type: StorageType): Storage | null {
    if (storageCache.has(type)) {
        return storageCache.get(type) ?? null;
    }

    let storage: Storage | null = null;

    try {
        const storageImpl = type === 'local' ? window.localStorage : window.sessionStorage;
        // Test if storage is actually available (can fail in incognito mode)
        const testKey = '__storage_test__';
        storageImpl.setItem(testKey, 'test');
        storageImpl.removeItem(testKey);
        storage = storageImpl;
    } catch {
        storage = null;
    }

    storageCache.set(type, storage);
    return storage;
}

function isQuotaExceededError(error: unknown): boolean {
    if (!(error instanceof DOMException)) {
        return false;
    }

    return (
        error.name === 'QuotaExceededError' ||
        error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    );
}

function createNoopSync(): (clearStorage?: boolean) => void {
    return () => {
        // No-op cleanup function
    };
}
