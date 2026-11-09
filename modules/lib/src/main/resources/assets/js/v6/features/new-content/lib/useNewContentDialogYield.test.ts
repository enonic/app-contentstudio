import { renderHook } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { $newContentDialog } = await vi.hoisted(async () => {
    const { map } = await import('nanostores');
    return { $newContentDialog: map({ open: false }) };
});

vi.mock('../model/newContentDialog.store', () => ({ $newContentDialog }));

import { useNewContentDialogYield } from './useNewContentDialogYield';

describe('useNewContentDialogYield', () => {
    afterEach(() => {
        $newContentDialog.setKey('open', false);
    });

    it('should not yield while the dialog is closed', () => {
        const { result } = renderHook(() => useNewContentDialogYield());

        expect(result.current.overlayHidden).toBe(false);
        expect(result.current.contentProps).toEqual({ modal: true, className: undefined });
        expect(result.current.shouldIgnoreClose()).toBe(false);
    });

    it('should hide, go non-modal and ignore closes while the dialog is open', () => {
        $newContentDialog.setKey('open', true);

        const { result } = renderHook(() => useNewContentDialogYield());

        expect(result.current.overlayHidden).toBe(true);
        expect(result.current.contentProps).toEqual({ modal: false, className: 'invisible' });
        expect(result.current.shouldIgnoreClose()).toBe(true);
    });
});
