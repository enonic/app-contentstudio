import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentId } from '../../../../app/content/ContentId';
import type { ContentPath } from '../../../../app/content/ContentPath';
import type { ContentSummary } from '../../../../app/content/ContentSummary';
import type { ContentServerChangeItem } from '../../../../app/event/ContentServerChangeItem';
import {
    emitContentArchived,
    emitContentDeleted,
    emitContentRenamed,
    emitContentUpdated,
} from '../../../shared/socket/socket.store';
import { start, stop } from './publishOrRequestDialog.service';
import { $publishOrRequestDialog, INITIAL_PUBLISH_OR_REQUEST_DIALOG_STATE } from './publishOrRequestDialog.store';

const { mockApplyChanges, mockRemove } = vi.hoisted(() => ({ mockApplyChanges: vi.fn(), mockRemove: vi.fn() }));

vi.mock('./commands/events', () => ({
    applyPublishOrRequestContentChanges: mockApplyChanges,
    removePublishOrRequestContents: mockRemove,
}));

const createItem = (id: string): ContentSummary =>
    ({ getContentId: () => new ContentId(id) }) as unknown as ContentSummary;

const createChangeItem = (id: string): ContentServerChangeItem =>
    ({ getContentId: () => new ContentId(id) }) as unknown as ContentServerChangeItem;

const setOpen = (open: boolean): void => {
    $publishOrRequestDialog.set({ ...INITIAL_PUBLISH_OR_REQUEST_DIALOG_STATE, open });
};

describe('publishOrRequestDialog.service', () => {
    beforeEach(() => {
        // A subscription is handed the last event at once, so start while the dialog is closed.
        setOpen(false);
        start();
        mockApplyChanges.mockReset();
        mockRemove.mockReset();
        setOpen(true);
    });

    afterEach(() => {
        stop();
        setOpen(false);
        vi.restoreAllMocks();
    });

    it('should hand over the contents that were updated', () => {
        const updated = [createItem('a')];

        emitContentUpdated(updated);

        expect(mockApplyChanges).toHaveBeenCalledExactlyOnceWith(updated);
    });

    it('should hand over the contents that were renamed', () => {
        const renamed = [createItem('a')];

        emitContentRenamed(renamed, [{} as ContentPath]);

        expect(mockApplyChanges).toHaveBeenCalledExactlyOnceWith(renamed);
    });

    it('should hand over the ids of the contents that were deleted', () => {
        emitContentDeleted([createChangeItem('a'), createChangeItem('b')]);

        expect(mockRemove).toHaveBeenCalledOnce();
        expect(mockRemove.mock.calls[0][0].map(String)).toEqual(['a', 'b']);
    });

    it('should hand over the ids of the contents that were archived', () => {
        emitContentArchived([createChangeItem('a')]);

        expect(mockRemove).toHaveBeenCalledOnce();
        expect(mockRemove.mock.calls[0][0].map(String)).toEqual(['a']);
    });

    it('should ignore the events while the dialog is closed', () => {
        setOpen(false);

        emitContentUpdated([createItem('a')]);
        emitContentDeleted([createChangeItem('a')]);

        expect(mockApplyChanges).not.toHaveBeenCalled();
        expect(mockRemove).not.toHaveBeenCalled();
    });

    it('should listen once across repeated starts and not at all after stop', () => {
        start();
        emitContentUpdated([createItem('a')]);
        expect(mockApplyChanges).toHaveBeenCalledOnce();

        stop();
        emitContentUpdated([createItem('a')]);
        expect(mockApplyChanges).toHaveBeenCalledOnce();
    });
});
