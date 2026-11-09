import { describe, expect, it } from 'vitest';
import { type DialogYield, mergeDialogYields } from './dialogYield';

const idle: DialogYield = {
    overlayHidden: false,
    contentProps: { modal: true, className: undefined },
    shouldIgnoreClose: () => false,
};

const underOverlay: DialogYield = {
    overlayHidden: false,
    contentProps: { modal: false, className: undefined },
    shouldIgnoreClose: () => true,
};

const underDialog: DialogYield = {
    overlayHidden: true,
    contentProps: { modal: false, className: 'invisible' },
    shouldIgnoreClose: () => true,
};

describe('mergeDialogYields', () => {
    it('should stay idle when every source is', () => {
        const merged = mergeDialogYields(idle, idle);

        expect(merged.overlayHidden).toBe(false);
        expect(merged.contentProps).toEqual({ modal: true, className: undefined });
        expect(merged.shouldIgnoreClose()).toBe(false);
    });

    it('should go non-modal and ignore closes under an overlay of one source', () => {
        const merged = mergeDialogYields(idle, underOverlay);

        expect(merged.overlayHidden).toBe(false);
        expect(merged.contentProps).toEqual({ modal: false, className: undefined });
        expect(merged.shouldIgnoreClose()).toBe(true);
    });

    it('should hide under a dialog of one source', () => {
        const merged = mergeDialogYields(underDialog, idle);

        expect(merged.overlayHidden).toBe(true);
        expect(merged.contentProps).toEqual({ modal: false, className: 'invisible' });
        expect(merged.shouldIgnoreClose()).toBe(true);
    });

    it('should read the sources when asked, not when merged', () => {
        let open = false;
        const merged = mergeDialogYields(idle, { ...idle, shouldIgnoreClose: () => open });

        expect(merged.shouldIgnoreClose()).toBe(false);
        open = true;
        expect(merged.shouldIgnoreClose()).toBe(true);
    });
});
