import {useEffect, useRef, useState} from 'react';

/**
 * React hook that returns a debounced version of a value.
 * The returned value only updates after the specified delay has passed
 * without the input value changing.
 *
 * @param value - The value to debounce
 * @param delay - The debounce delay in milliseconds
 * @returns The debounced value
 *
 * @example
 * ```tsx
 * const [searchQuery, setSearchQuery] = useState('');
 * const debouncedQuery = useDebouncedValue(searchQuery, 300);
 *
 * // Effect only runs when debouncedQuery changes (after 300ms of no typing)
 * useEffect(() => {
 *     if (debouncedQuery) {
 *         searchApi(debouncedQuery);
 *     }
 * }, [debouncedQuery]);
 * ```
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);
    const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

    useEffect(() => {
        // Clear existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Set new timeout to update debounced value
        timeoutRef.current = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Cleanup on unmount or value change
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [value, delay]);

    return debouncedValue;
}
