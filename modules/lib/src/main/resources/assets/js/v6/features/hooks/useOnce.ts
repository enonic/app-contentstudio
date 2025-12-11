import {useEffect, useRef} from 'react';

/**
 * Executes an effect callback exactly once when the condition becomes true.
 * Similar to useEffect, but the callback only executes once per component lifecycle,
 * even if the condition toggles between true and false afterward.
 *
 * @param effect - The effect callback to execute (can return a cleanup function)
 * @param condition - When true, the effect will execute (only the first time)
 *
 * @example
 * // Run initialization once when data is loaded
 * useOnceWhen(() => {
 *     initializeComponent(data);
 * }, isDataLoaded);
 *
 * @example
 * // With cleanup function
 * useOnceWhen(() => {
 *     const subscription = subscribe(data);
 *     return () => subscription.unsubscribe();
 * }, isReady);
 */
export function useOnceWhen(
    effect: () => void | (() => void),
    condition: boolean
): void {
    const hasRun = useRef(false);
    const effectRef = useRef(effect);

    // Always keep the ref updated to the latest effect
    effectRef.current = effect;

    useEffect(() => {
        if (condition && !hasRun.current) {
            hasRun.current = true;
            return effectRef.current();
        }
    }, [condition]);
}
