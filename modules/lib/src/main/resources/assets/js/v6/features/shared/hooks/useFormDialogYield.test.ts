import { renderHook } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type DialogYield } from '../../../shared/ui/dialogs/dialogYield';

const { mockUseHtmlAreaDialogYield, mockUseNewContentDialogYield } = vi.hoisted(() => ({
    mockUseHtmlAreaDialogYield: vi.fn(),
    mockUseNewContentDialogYield: vi.fn(),
}));

vi.mock('./useHtmlAreaDialogYield', () => ({ useHtmlAreaDialogYield: mockUseHtmlAreaDialogYield }));
vi.mock('../../new-content/lib/useNewContentDialogYield', () => ({
    useNewContentDialogYield: mockUseNewContentDialogYield,
}));

import { useFormDialogYield } from './useFormDialogYield';

const idle: DialogYield = {
    overlayHidden: false,
    contentProps: { modal: true, className: undefined },
    shouldIgnoreClose: () => false,
};

const underDialog: DialogYield = {
    overlayHidden: true,
    contentProps: { modal: false, className: 'invisible' },
    shouldIgnoreClose: () => true,
};

describe('useFormDialogYield', () => {
    beforeEach(() => {
        mockUseHtmlAreaDialogYield.mockReturnValue(idle);
        mockUseNewContentDialogYield.mockReturnValue(idle);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should merge the HtmlArea and the New Content yields', () => {
        mockUseNewContentDialogYield.mockReturnValue(underDialog);

        const { result } = renderHook(() => useFormDialogYield());

        expect(result.current.overlayHidden).toBe(true);
        expect(result.current.contentProps).toEqual({ modal: false, className: 'invisible' });
        expect(result.current.shouldIgnoreClose()).toBe(true);
    });

    it('should keep shouldIgnoreClose stable while following the latest sources', () => {
        const { result, rerender } = renderHook(() => useFormDialogYield());
        const { shouldIgnoreClose } = result.current;
        expect(shouldIgnoreClose()).toBe(false);

        mockUseHtmlAreaDialogYield.mockReturnValue(underDialog);
        rerender();

        expect(result.current.shouldIgnoreClose).toBe(shouldIgnoreClose);
        expect(shouldIgnoreClose()).toBe(true);
    });
});
