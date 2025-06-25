/**
 * Creates a throttled function with trailing edge execution guarantee.
 *
 * This ensures storage writes are optimized while guaranteeing data consistency:
 * - Executes immediately on first call (leading edge) for quick user feedback
 * - Batches rapid consecutive calls during the throttle period
 * - GUARANTEES execution of the final value after changes settle (trailing edge)
 * - Never loses updates - the last value is always written
 *
 * This is ideal for storage sync because:
 * 1. Users see their changes persisted immediately (first write is instant)
 * 2. We avoid excessive writes during rapid updates (batching)
 * 3. Storage always reflects the final state (trailing edge guarantee)
 *
 * Example timeline:
 * t=0ms:   update1 → execute immediately (leading)
 * t=50ms:  update2 → scheduled for t=100ms
 * t=80ms:  update3 → still scheduled for t=100ms
 * t=100ms: update3 executes (trailing - final value guaranteed)
 *
 * @param fn - The function to throttle
 * @param delay - The throttle delay in milliseconds
 * @returns Throttled function with cancel and flush methods
 */
export function createThrottle<T extends(...args: unknown[]) => void>(
    fn: T,
    delay: number
): T & {cancel: () => void; flush: () => void} {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let lastArgs: Parameters<T> | null = null;
    let lastContext: unknown = null;

    const throttled = function (this: unknown, ...args: Parameters<T>) {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const context = this;
        lastArgs = args;
        lastContext = context;

        // Execute immediately if not in cooldown
        if (timeoutId === null) {
            fn.apply(context, args);
            lastArgs = null; // Clear since we just executed

            // Start cooldown period with trailing edge guarantee
            timeoutId = setTimeout(() => {
                timeoutId = null;

                // Trailing edge: execute final value if there were updates during cooldown
                if (lastArgs !== null) {
                    fn.apply(lastContext, lastArgs);
                    lastArgs = null;
                }
            }, delay);
        }
    } as T & {cancel: () => void; flush: () => void};

    throttled.cancel = () => {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
        lastArgs = null;
        lastContext = null;
    };

    throttled.flush = () => {
        if (lastArgs !== null) {
            fn.apply(lastContext, lastArgs);
            lastArgs = null;
        }
        throttled.cancel();
    };

    return throttled;
}
