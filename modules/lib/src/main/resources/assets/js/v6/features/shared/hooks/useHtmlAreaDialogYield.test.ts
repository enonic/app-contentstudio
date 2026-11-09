import { renderHook } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { $isHtmlAreaOverlayOpen, $isHtmlAreaModalDialogOpen } = await vi.hoisted(async () => {
    const { atom } = await import('nanostores');
    return { $isHtmlAreaOverlayOpen: atom(false), $isHtmlAreaModalDialogOpen: atom(false) };
});

vi.mock('../../rich-text-inserts/model/htmlAreaModal.store', () => ({
    $isHtmlAreaOverlayOpen,
    $isHtmlAreaModalDialogOpen,
}));

import { useHtmlAreaDialogYield } from './useHtmlAreaDialogYield';

describe('useHtmlAreaDialogYield', () => {
    afterEach(() => {
        $isHtmlAreaOverlayOpen.set(false);
        $isHtmlAreaModalDialogOpen.set(false);
    });

    it('should not yield while the editor has nothing open', () => {
        const { result } = renderHook(() => useHtmlAreaDialogYield());

        expect(result.current.overlayHidden).toBe(false);
        expect(result.current.contentProps).toEqual({ modal: true, className: undefined });
        expect(result.current.shouldIgnoreClose()).toBe(false);
    });

    it('should go non-modal but stay visible under a popup, e.g. search or quick table', () => {
        $isHtmlAreaOverlayOpen.set(true);

        const { result } = renderHook(() => useHtmlAreaDialogYield());

        expect(result.current.overlayHidden).toBe(false);
        expect(result.current.contentProps).toEqual({ modal: false, className: undefined });
        expect(result.current.shouldIgnoreClose()).toBe(true);
    });

    it('should hide under a dialog, e.g. link, image or fullscreen', () => {
        // The overlay store includes the dialogs, so both are open at once.
        $isHtmlAreaOverlayOpen.set(true);
        $isHtmlAreaModalDialogOpen.set(true);

        const { result } = renderHook(() => useHtmlAreaDialogYield());

        expect(result.current.overlayHidden).toBe(true);
        expect(result.current.contentProps).toEqual({ modal: false, className: 'invisible' });
        expect(result.current.shouldIgnoreClose()).toBe(true);
    });

    it('should keep shouldIgnoreClose stable and read the store when called', () => {
        const { result, rerender } = renderHook(() => useHtmlAreaDialogYield());
        const { shouldIgnoreClose } = result.current;
        expect(shouldIgnoreClose()).toBe(false);

        $isHtmlAreaOverlayOpen.set(true);
        rerender();

        expect(result.current.shouldIgnoreClose).toBe(shouldIgnoreClose);
        expect(shouldIgnoreClose()).toBe(true);
    });
});
