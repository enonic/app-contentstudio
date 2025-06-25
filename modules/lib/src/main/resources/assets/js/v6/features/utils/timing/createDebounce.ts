/**
 * Creates a debounced function that delays execution until after calls stop.
 *
 * Unlike throttle which executes immediately then limits, debounce waits until
 * the specified delay has passed without any new calls before executing.
 *
 * This is ideal for scenarios where you want to batch rapid updates and only
 * act on the final state, such as:
 * - Reloading data after multiple server events settle
 * - Search input that waits for user to stop typing
 * - Window resize handlers
 *
 * Example timeline with 100ms delay:
 * t=0ms:   call1 → scheduled for t=100ms
 * t=50ms:  call2 → rescheduled for t=150ms
 * t=80ms:  call3 → rescheduled for t=180ms
 * t=180ms: call3 executes (no calls for 100ms)
 *
 * @param fn - The function to debounce
 * @param delay - The debounce delay in milliseconds
 * @returns Debounced function with cancel and flush methods
 */
export function createDebounce<T extends(...args: unknown[]) => void>(
    fn: T,
    delay: number,
): T & {cancel: () => void; flush: () => void} {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let lastArgs: Parameters<T> | null = null;
    let lastContext: unknown = null;

    const debounced = function (this: unknown, ...args: Parameters<T>) {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const context = this;
        lastArgs = args;
        lastContext = context;

        // Clear existing timeout and schedule new one
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(() => {
            timeoutId = null;
            if (lastArgs !== null) {
                fn.apply(lastContext, lastArgs);
                lastArgs = null;
            }
        }, delay);
    } as T & {cancel: () => void; flush: () => void};

    debounced.cancel = () => {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
        lastArgs = null;
        lastContext = null;
    };

    debounced.flush = () => {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
        if (lastArgs !== null) {
            fn.apply(lastContext, lastArgs);
            lastArgs = null;
            lastContext = null;
        }
    };

    return debounced;
}
