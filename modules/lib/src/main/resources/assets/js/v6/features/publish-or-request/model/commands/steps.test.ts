import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentId } from '../../../../../app/content/ContentId';
import { $publishOrRequestDialog, INITIAL_PUBLISH_OR_REQUEST_DIALOG_STATE } from '../publishOrRequestDialog.store';
import { setPublishOrRequestDialogStep } from './steps';

vi.mock('../../../../../app/settings/data/project/ProjectHelper', () => ({
    ProjectHelper: { canRequestPublish: () => true },
}));

describe('publish or request dialog step commands', () => {
    beforeEach(() => {
        // Something to publish and nothing in the way, so the next step is allowed.
        $publishOrRequestDialog.set({
            ...INITIAL_PUBLISH_OR_REQUEST_DIALOG_STATE,
            open: true,
            publishableIds: [new ContentId('a')],
        });
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

        it('should refuse the next step while something stands in the way', () => {
            $publishOrRequestDialog.setKey('invalidIds', [new ContentId('a')]);

            setPublishOrRequestDialogStep('publishing');

            expect($publishOrRequestDialog.get().step).toBe('items');
        });

        it('should let the user go back while something stands in the way', () => {
            setPublishOrRequestDialogStep('publishing');
            $publishOrRequestDialog.setKey('invalidIds', [new ContentId('a')]);

            setPublishOrRequestDialogStep('items');

            expect($publishOrRequestDialog.get().step).toBe('items');
        });

        it('should leave the user on the next step when something comes to stand in the way', () => {
            setPublishOrRequestDialogStep('publishing');

            $publishOrRequestDialog.setKey('invalidIds', [new ContentId('a')]);

            expect($publishOrRequestDialog.get().step).toBe('publishing');
        });

        it('should keep the dialog open', () => {
            setPublishOrRequestDialogStep('publishing');

            expect($publishOrRequestDialog.get().open).toBe(true);
        });
    });
});
