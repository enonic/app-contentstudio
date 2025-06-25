import {beforeEach, afterEach, describe, expect, it, vi} from 'vitest';
import {createDebounce} from './createDebounce';

describe('createDebounce', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should delay execution until after delay has passed', () => {
        const fn = vi.fn();
        const debounced = createDebounce(fn, 100);

        debounced();
        expect(fn).not.toHaveBeenCalled();

        vi.advanceTimersByTime(99);
        expect(fn).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1);
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should reset timer on subsequent calls', () => {
        const fn = vi.fn();
        const debounced = createDebounce(fn, 100);

        debounced();
        vi.advanceTimersByTime(50);

        debounced(); // Reset timer
        vi.advanceTimersByTime(50);
        expect(fn).not.toHaveBeenCalled();

        vi.advanceTimersByTime(50);
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should use the latest arguments', () => {
        const fn = vi.fn();
        const debounced = createDebounce(fn, 100);

        debounced('first');
        debounced('second');
        debounced('third');

        vi.advanceTimersByTime(100);

        expect(fn).toHaveBeenCalledTimes(1);
        expect(fn).toHaveBeenCalledWith('third');
    });

    it('should cancel pending execution', () => {
        const fn = vi.fn();
        const debounced = createDebounce(fn, 100);

        debounced();
        debounced.cancel();

        vi.advanceTimersByTime(200);
        expect(fn).not.toHaveBeenCalled();
    });

    it('should flush pending execution immediately', () => {
        const fn = vi.fn();
        const debounced = createDebounce(fn, 100);

        debounced('value');
        expect(fn).not.toHaveBeenCalled();

        debounced.flush();
        expect(fn).toHaveBeenCalledTimes(1);
        expect(fn).toHaveBeenCalledWith('value');

        // Should not execute again after flush
        vi.advanceTimersByTime(200);
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should not execute on flush if nothing is pending', () => {
        const fn = vi.fn();
        const debounced = createDebounce(fn, 100);

        debounced.flush();
        expect(fn).not.toHaveBeenCalled();
    });

    it('should handle multiple independent debounce instances', () => {
        const fn1 = vi.fn();
        const fn2 = vi.fn();
        const debounced1 = createDebounce(fn1, 100);
        const debounced2 = createDebounce(fn2, 50);

        debounced1();
        debounced2();

        vi.advanceTimersByTime(50);
        expect(fn1).not.toHaveBeenCalled();
        expect(fn2).toHaveBeenCalledTimes(1);

        vi.advanceTimersByTime(50);
        expect(fn1).toHaveBeenCalledTimes(1);
    });

    it('should preserve this context', () => {
        const obj = {
            value: 42,
            fn: vi.fn(function (this: {value: number}) {
                return this.value;
            }),
        };

        const debounced = createDebounce(obj.fn, 100);
        debounced.call(obj);

        vi.advanceTimersByTime(100);
        expect(obj.fn).toHaveBeenCalled();
        expect(obj.fn.mock.instances[0]).toBe(obj);
    });
});
