import { renderHook } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ContentSummary } from '../../../app/content/ContentSummary';
import { emitContentUpdated } from './socket.store';
import { useContentUpdateListener } from './useContentUpdateListener';

function summary(id: string): ContentSummary {
    return {
        getId: () => id,
    } as unknown as ContentSummary;
}

describe('useContentUpdateListener', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should call onUpdated with the matching summary when the event contains the watched id', () => {
        const onUpdated = vi.fn();
        renderHook(() => useContentUpdateListener('content-1', onUpdated));

        const match = summary('content-1');
        emitContentUpdated([summary('other-1'), match, summary('other-2')]);

        expect(onUpdated).toHaveBeenCalledTimes(1);
        expect(onUpdated).toHaveBeenCalledWith(match);
    });

    it('should not call onUpdated when the event does not contain the watched id', () => {
        const onUpdated = vi.fn();
        renderHook(() => useContentUpdateListener('content-1', onUpdated));

        emitContentUpdated([summary('other-1'), summary('other-2')]);

        expect(onUpdated).not.toHaveBeenCalled();
    });

    it('should not call onUpdated when contentId is undefined', () => {
        const onUpdated = vi.fn();
        renderHook(() => useContentUpdateListener(undefined, onUpdated));

        emitContentUpdated([summary('content-1')]);

        expect(onUpdated).not.toHaveBeenCalled();
    });

    it('should not replay an event emitted before mount', () => {
        emitContentUpdated([summary('content-1')]);

        const onUpdated = vi.fn();
        renderHook(() => useContentUpdateListener('content-1', onUpdated));

        expect(onUpdated).not.toHaveBeenCalled();
    });

    it('should stop listening after unmount', () => {
        const onUpdated = vi.fn();
        const { unmount } = renderHook(() => useContentUpdateListener('content-1', onUpdated));

        unmount();
        emitContentUpdated([summary('content-1')]);

        expect(onUpdated).not.toHaveBeenCalled();
    });

    it('should stop listening when contentId changes to undefined', () => {
        const onUpdated = vi.fn();
        const { rerender } = renderHook(
            ({ id }: { id: string | undefined }) => useContentUpdateListener(id, onUpdated),
            {
                initialProps: { id: 'content-1' as string | undefined },
            },
        );

        rerender({ id: undefined });
        emitContentUpdated([summary('content-1')]);

        expect(onUpdated).not.toHaveBeenCalled();
    });

    it('should watch the new id when contentId changes', () => {
        const onUpdated = vi.fn();
        const { rerender } = renderHook(
            ({ id }: { id: string | undefined }) => useContentUpdateListener(id, onUpdated),
            {
                initialProps: { id: 'content-1' as string | undefined },
            },
        );

        rerender({ id: 'content-2' });

        emitContentUpdated([summary('content-1')]);
        expect(onUpdated).not.toHaveBeenCalled();

        const match = summary('content-2');
        emitContentUpdated([match]);
        expect(onUpdated).toHaveBeenCalledTimes(1);
        expect(onUpdated).toHaveBeenCalledWith(match);
    });

    it('should use the latest callback without requiring memoization', () => {
        const first = vi.fn();
        const second = vi.fn();
        const { rerender } = renderHook(({ onUpdated }) => useContentUpdateListener('content-1', onUpdated), {
            initialProps: { onUpdated: first },
        });

        rerender({ onUpdated: second });
        emitContentUpdated([summary('content-1')]);

        expect(first).not.toHaveBeenCalled();
        expect(second).toHaveBeenCalledTimes(1);
    });
});
