import {useEffect, useRef} from 'react';
import {createDebounce} from '../timing/createDebounce';

/**
 * React hook that returns a debounced version of the callback.
 * The debounced function is stable across renders.
 * Automatically cancels on unmount.
 *
 * @param callback - The function to debounce
 * @param delay - The debounce delay in milliseconds
 * @returns Debounced function with cancel and flush methods
 *
 * @example
 * ```tsx
 * const saveDocument = useDebouncedCallback((content: string) => {
 *     api.save(content);
 * }, 500);
 *
 * // Call it normally - will debounce
 * saveDocument(editorContent);
 *
 * // Force immediate execution
 * saveDocument.flush();
 *
 * // Cancel pending execution
 * saveDocument.cancel();
 * ```
 */
export function useDebouncedCallback<T extends(...args: never[]) => void>(
    callback: T,
    delay: number,
): T & {cancel: () => void; flush: () => void} {
    const callbackRef = useRef(callback);

    // Update ref when callback changes (no new debounce instance needed)
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    // Create stable debounced function (only once)
    const debouncedFn = useRef<ReturnType<typeof createDebounce<T>>>();

    if (!debouncedFn.current) {
        debouncedFn.current = createDebounce(
            ((...args: Parameters<T>) => {
                callbackRef.current(...args);
            }) as T,
            delay,
        );
    }

    // Cancel on unmount
    useEffect(() => {
        return () => {
            debouncedFn.current?.cancel();
        };
    }, []);

    return debouncedFn.current;
}
