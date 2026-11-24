import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { $publishOrRequestDialog, INITIAL_PUBLISH_OR_REQUEST_DIALOG_STATE } from '../publishOrRequestDialog.store';
import { setPublishOrRequestDialogStep } from './steps';

describe('publish or request dialog step commands', () => {
    beforeEach(() => {
        $publishOrRequestDialog.set({ ...INITIAL_PUBLISH_OR_REQUEST_DIALOG_STATE, open: true });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('setPublishOrRequestDialogStep', () => {
        it('should show the given step', () => {
            setPublishOrRequestDialogStep('publishing');

            expect($publishOrRequestDialog.get().step).toBe('publishing');
        });

        it('should go back to an earlier step', () => {
            setPublishOrRequestDialogStep('publishing');

            setPublishOrRequestDialogStep('items');

            expect($publishOrRequestDialog.get().step).toBe('items');
        });

        it('should ignore an unknown step', () => {
            setPublishOrRequestDialogStep('summary');

            expect($publishOrRequestDialog.get().step).toBe('items');
        });

        it('should keep the dialog open', () => {
            setPublishOrRequestDialogStep('publishing');

            expect($publishOrRequestDialog.get().open).toBe(true);
        });
    });
});
