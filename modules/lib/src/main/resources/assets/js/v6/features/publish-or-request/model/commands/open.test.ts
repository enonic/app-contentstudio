import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { $publishOrRequestDialog, INITIAL_PUBLISH_OR_REQUEST_DIALOG_STATE } from '../publishOrRequestDialog.store';
import { closePublishOrRequestDialog, openPublishOrRequestDialog } from './open';

describe('publish or request dialog open commands', () => {
    beforeEach(() => {
        $publishOrRequestDialog.set({ ...INITIAL_PUBLISH_OR_REQUEST_DIALOG_STATE });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('openPublishOrRequestDialog', () => {
        it('should open the dialog on the first step', () => {
            openPublishOrRequestDialog();

            expect($publishOrRequestDialog.get()).toEqual({ open: true, step: 'items' });
        });

        it('should drop the step of an earlier run', () => {
            $publishOrRequestDialog.set({ open: false, step: 'publishing' });

            openPublishOrRequestDialog();

            expect($publishOrRequestDialog.get().step).toBe('items');
        });
    });

    describe('closePublishOrRequestDialog', () => {
        it('should close the dialog and reset its state', () => {
            $publishOrRequestDialog.set({ open: true, step: 'publishing' });

            closePublishOrRequestDialog();

            expect($publishOrRequestDialog.get()).toEqual(INITIAL_PUBLISH_OR_REQUEST_DIALOG_STATE);
        });
    });
});
