import {renderHook, act} from '@testing-library/preact';
import {describe, expect, it, vi, beforeEach, afterEach} from 'vitest';
import {useDebouncedValue} from './useDebouncedValue';

describe('useDebouncedValue', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns initial value immediately', () => {
        const {result} = renderHook(() => useDebouncedValue('initial', 300));
        expect(result.current).toBe('initial');
    });

    it('does not update value before delay', () => {
        const {result, rerender} = renderHook(
            ({value}) => useDebouncedValue(value, 300),
            {initialProps: {value: 'initial'}},
        );

        rerender({value: 'updated'});

        // Value should still be initial before delay
        expect(result.current).toBe('initial');

        // Advance time but not enough
        act(() => {
            vi.advanceTimersByTime(200);
        });

        expect(result.current).toBe('initial');
    });

    it('updates value after delay', () => {
        const {result, rerender} = renderHook(
            ({value}) => useDebouncedValue(value, 300),
            {initialProps: {value: 'initial'}},
        );

        rerender({value: 'updated'});

        act(() => {
            vi.advanceTimersByTime(300);
        });

        expect(result.current).toBe('updated');
    });

    it('resets timer on rapid changes', () => {
        const {result, rerender} = renderHook(
            ({value}) => useDebouncedValue(value, 300),
            {initialProps: {value: 'a'}},
        );

        // Rapid changes
        rerender({value: 'ab'});
        act(() => {
            vi.advanceTimersByTime(100);
        });

        rerender({value: 'abc'});
        act(() => {
            vi.advanceTimersByTime(100);
        });

        rerender({value: 'abcd'});
        act(() => {
            vi.advanceTimersByTime(100);
        });

        // Still showing initial value since timer keeps resetting
        expect(result.current).toBe('a');

        // Now wait the full delay
        act(() => {
            vi.advanceTimersByTime(300);
        });

        // Should now show the latest value
        expect(result.current).toBe('abcd');
    });

    it('works with different value types', () => {
        // Test with number
        const {result: numberResult} = renderHook(() => useDebouncedValue(42, 100));
        expect(numberResult.current).toBe(42);

        // Test with object
        const obj = {foo: 'bar'};
        const {result: objectResult} = renderHook(() => useDebouncedValue(obj, 100));
        expect(objectResult.current).toBe(obj);

        // Test with null
        const {result: nullResult} = renderHook(() => useDebouncedValue(null, 100));
        expect(nullResult.current).toBeNull();
    });

    it('cleans up timeout on unmount', () => {
        const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

        const {unmount, rerender} = renderHook(
            ({value}) => useDebouncedValue(value, 300),
            {initialProps: {value: 'initial'}},
        );

        rerender({value: 'updated'});
        unmount();

        expect(clearTimeoutSpy).toHaveBeenCalled();
        clearTimeoutSpy.mockRestore();
    });

    it('handles delay of 0', () => {
        const {result, rerender} = renderHook(
            ({value}) => useDebouncedValue(value, 0),
            {initialProps: {value: 'initial'}},
        );

        rerender({value: 'updated'});

        act(() => {
            vi.advanceTimersByTime(0);
        });

        expect(result.current).toBe('updated');
    });
});
