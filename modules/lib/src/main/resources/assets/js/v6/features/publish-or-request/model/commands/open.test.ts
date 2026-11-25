import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentId } from '../../../../../app/content/ContentId';
import type { ContentSummary } from '../../../../../app/content/ContentSummary';
import { $publishOrRequestDialog, INITIAL_PUBLISH_OR_REQUEST_DIALOG_STATE } from '../publishOrRequestDialog.store';
import { closePublishOrRequestDialog, getPublishOrRequestDialogSessionId, openPublishOrRequestDialog } from './open';

const { mockLoad, mockCancelLoad } = vi.hoisted(() => ({
    mockLoad: vi.fn(),
    mockCancelLoad: vi.fn(),
}));

vi.mock('./load', () => ({
    loadPublishOrRequestDialogData: mockLoad,
    cancelPublishOrRequestDialogLoad: mockCancelLoad,
}));

const createItem = (id: string): ContentSummary =>
    ({ getId: () => id, getContentId: () => new ContentId(id) }) as unknown as ContentSummary;

const excludeChildrenIds = (): string[] => $publishOrRequestDialog.get().excludeChildrenIds.map(String);

describe('publish or request dialog open commands', () => {
    beforeEach(() => {
        mockLoad.mockReset();
        mockCancelLoad.mockReset();
        $publishOrRequestDialog.set({ ...INITIAL_PUBLISH_OR_REQUEST_DIALOG_STATE });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('openPublishOrRequestDialog', () => {
        it('should open the dialog on the first step with the given items', () => {
            const items = [createItem('a'), createItem('b')];

            openPublishOrRequestDialog(items);

            expect($publishOrRequestDialog.get()).toMatchObject({ open: true, step: 'items', items });
        });

        it('should leave out the children of every item by default', () => {
            openPublishOrRequestDialog([createItem('a'), createItem('b')]);

            expect(excludeChildrenIds()).toEqual(['a', 'b']);
        });

        it('should leave out no children when asked to include them', () => {
            openPublishOrRequestDialog([createItem('a'), createItem('b')], true);

            expect(excludeChildrenIds()).toEqual([]);
        });

        it('should keep its own copy of the items', () => {
            const items = [createItem('a')];

            openPublishOrRequestDialog(items);
            items.push(createItem('b'));

            expect($publishOrRequestDialog.get().items).toHaveLength(1);
        });

        it('should drop the state of an earlier run', () => {
            $publishOrRequestDialog.set({
                ...INITIAL_PUBLISH_OR_REQUEST_DIALOG_STATE,
                step: 'publishing',
                items: [createItem('a')],
                dependants: [createItem('d')],
                failed: true,
            });
            const items = [createItem('b')];

            openPublishOrRequestDialog(items);

            expect($publishOrRequestDialog.get()).toEqual({
                ...INITIAL_PUBLISH_OR_REQUEST_DIALOG_STATE,
                open: true,
                items,
                excludeChildrenIds: [new ContentId('b')],
            });
        });

        it('should load the dependencies of the items', () => {
            openPublishOrRequestDialog([createItem('a')]);

            expect(mockLoad).toHaveBeenCalledOnce();
        });
    });

    describe('closePublishOrRequestDialog', () => {
        it('should close the dialog and reset its state', () => {
            $publishOrRequestDialog.set({
                ...INITIAL_PUBLISH_OR_REQUEST_DIALOG_STATE,
                open: true,
                step: 'publishing',
                items: [createItem('a')],
                dependants: [createItem('d')],
            });

            closePublishOrRequestDialog();

            expect($publishOrRequestDialog.get()).toEqual(INITIAL_PUBLISH_OR_REQUEST_DIALOG_STATE);
        });

        it('should drop a load that is still running', () => {
            closePublishOrRequestDialog();

            expect(mockCancelLoad).toHaveBeenCalledOnce();
        });
    });

    describe('getPublishOrRequestDialogSessionId', () => {
        it('should change when the dialog is opened and when it is closed', () => {
            const initial = getPublishOrRequestDialogSessionId();

            openPublishOrRequestDialog([createItem('a')]);
            const opened = getPublishOrRequestDialogSessionId();
            closePublishOrRequestDialog();
            const closed = getPublishOrRequestDialogSessionId();

            expect(new Set([initial, opened, closed]).size).toBe(3);
        });
    });
});
