import {AllPaths, BaseDeepMap, DeepMapStore, getPath, MapStore, ReadableAtom, subscribeKeys} from 'nanostores';
import {normalize} from './text';

type AllowedStores<T extends BaseDeepMap> = MapStore<T> | DeepMapStore<T> | ReadableAtom<T>;
type SomeStore<T extends BaseDeepMap> = AllowedStores<T>;

/**
 * Synchronizes a Nanostores store with localStorage for automatic persistence.
 *
 * This utility sets up a synchronization between the store and localStorage.
 * Whenever the specified store changes, its value (or a specific key via `options.syncPath`)
 * is serialized and stored in localStorage.
 * Optionally, you can control encoding, decoding, or throttle
 * the writes to localStorage. Removal or clearing is also handled.
 *
 * @param store      Nanostores store instance (MapStore, DeepMapStore, or ReadableAtom).
 * @param storeName  Logical name for the localStorage key (will benormalized).
 * @param options
 *   - syncPath:    Path string/key to a specific store value (e.g. 'activeProjectId').
 *   - encode:      Custom function to serialize outgoing state (default: JSON.stringify).
 *   - decode:      Custom function to parse stored state (default: JSON.parse).
 *   - throttleMs:  Throttle/delay storage writes in ms (default: 100).
 *
 * @returns
 *   - get():     Reads and parses the value from localStorage, if present.
 *   - unsync():  Unsubscribe from the store.
 */
export function syncStore<T extends BaseDeepMap, P extends AllPaths<T> | undefined = undefined>(
    store: SomeStore<T>,
    storeName: string,
    options?: Partial<{
        syncPath?: P;
        encode: (data: P extends undefined ? T : T[P]) => string;
        decode: (raw: string) => P extends undefined ? T : T[P];
        throttleMs: number;
    }>
): {
    get: () => (P extends undefined ? T : T[P]) | undefined;
    unsync: () => void;
} {
    const {
        syncPath,
        throttleMs = 100,
        encode = (data: T) => JSON.stringify(data),
        decode = (raw: string) => JSON.parse(raw),
    } = options ?? {};

    const lsKey = getLocalStorageKey(storeName, syncPath?.toString());

    const throttledWrite = createThrottle((value) => {
        try {
            const valueToStore = syncPath ? getPath(value, syncPath) : value;

            if (valueToStore !== undefined) {
                localStorage.setItem(lsKey, encode(valueToStore));
                return;
            }

            localStorage.removeItem(lsKey);
        } catch (error: unknown) {
            console.error(`Error syncing store with local storage ${lsKey}`, error);
        }
    }, throttleMs);

    const unsubscribe =
        !isReadableAtomStore<T>(store) && syncPath
            ? // @ts-expect-error - syncPath is a valid path for the store
              subscribeKeys(store, [syncPath], throttledWrite)
            : store.subscribe(throttledWrite);

    return {
        get: () => {
            try {
                const raw = localStorage.getItem(lsKey);
                if (!raw) return undefined;
                return decode(raw);
            } catch (error: unknown) {
                console.error(`Error getting value from local storage ${lsKey}`, error);
                return undefined;
            }
        },

        unsync: () => {
            try {
                throttledWrite.cancel();
                unsubscribe();
            } catch (error: unknown) {
                console.error(`Error unsynching from store ${storeName}`, error);
            }
        },
    };
}

//
// * Utilities
//

function getLocalStorageKey(storeName: string, syncPath?: string): string {
    return 'enonic-cs:' + normalize(storeName + (syncPath ? ':' + syncPath : ''));
}

function isReadableAtomStore<T extends BaseDeepMap>(store: AllowedStores<T>): store is ReadableAtom<T> {
    return !('setKey' in store);
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createThrottle<T extends(...args: any[]) => void>(fn: T, delay: number): T & {cancel:() => void} {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let lastArgs: Parameters<T> | null = null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const throttled = function (this: any, ...args: Parameters<T>) {
        lastArgs = args;

        if (timeoutId === null) {
            timeoutId = setTimeout(() => {
                if (lastArgs) {
                    fn.apply(this, lastArgs);
                }
                timeoutId = null;
                lastArgs = null;
            }, delay);
        }
    } as T & {cancel: () => void};

    throttled.cancel = () => {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
            timeoutId = null;
            lastArgs = null;
        }
    };

    return throttled;
}
