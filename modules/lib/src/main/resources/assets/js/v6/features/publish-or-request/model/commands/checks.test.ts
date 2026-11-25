import { errAsync, okAsync } from 'neverthrow';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentId } from '../../../../../app/content/ContentId';
import type { ContentSummary } from '../../../../../app/content/ContentSummary';
import { $publishOrRequestDialog, INITIAL_PUBLISH_OR_REQUEST_DIALOG_STATE } from '../publishOrRequestDialog.store';
import {
    excludePublishOrRequestInProgress,
    excludePublishOrRequestInvalid,
    excludePublishOrRequestNotPublishable,
    markPublishOrRequestInProgressAsReady,
} from './checks';

const { mockLoad, mockMarkAsReady, mockNotifyInfo, mockNotifyError } = vi.hoisted(() => ({
    mockLoad: vi.fn(),
    mockMarkAsReady: vi.fn(),
    mockNotifyInfo: vi.fn(),
    mockNotifyError: vi.fn(),
}));

vi.mock('./load', () => ({ loadPublishOrRequestDialogData: mockLoad }));

vi.mock('../../../../entities/content/api/publish.api', () => ({ markAsReady: mockMarkAsReady }));

vi.mock('../../../../shared/notifications', () => ({ notifyInfo: mockNotifyInfo, notifyError: mockNotifyError }));

vi.mock('../../../../shared/i18n', () => ({
    i18n: (key: string, ...args: unknown[]) => [key, ...args].join(' '),
}));

const createItem = (id: string, name: string): ContentSummary =>
    ({ getContentId: () => new ContentId(id), getDisplayName: () => name }) as unknown as ContentSummary;

const toIds = (...ids: string[]): ContentId[] => ids.map((id) => new ContentId(id));

const excludedIds = (): string[] => $publishOrRequestDialog.get().excludedDependantIds.map(String);

const appliedExcludedIds = (): string[] => $publishOrRequestDialog.get().appliedExcludedDependantIds.map(String);

describe('publish or request dialog checks commands', () => {
    beforeEach(() => {
        mockLoad.mockReset();
        mockMarkAsReady.mockReset();
        mockNotifyInfo.mockReset();
        mockNotifyError.mockReset();
        mockMarkAsReady.mockReturnValue(okAsync(undefined));
        $publishOrRequestDialog.set({
            ...INITIAL_PUBLISH_OR_REQUEST_DIALOG_STATE,
            open: true,
            items: [createItem('main', 'Main')],
            dependantIds: toIds('d0', 'd1', 'd2'),
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('excludePublishOrRequestInProgress', () => {
        it('should untick the in progress dependencies, apply it and load again', () => {
            $publishOrRequestDialog.setKey('inProgressIds', toIds('d0', 'd2'));

            excludePublishOrRequestInProgress();

            expect(excludedIds()).toEqual(['d0', 'd2']);
            expect(appliedExcludedIds()).toEqual(['d0', 'd2']);
            expect(mockLoad).toHaveBeenCalledOnce();
        });

        it('should keep the dependencies that are excluded already', () => {
            $publishOrRequestDialog.setKey('excludedDependantIds', toIds('d1'));
            $publishOrRequestDialog.setKey('appliedExcludedDependantIds', toIds('d1'));
            $publishOrRequestDialog.setKey('inProgressIds', toIds('d0'));

            excludePublishOrRequestInProgress();

            expect(excludedIds()).toEqual(['d1', 'd0']);
            expect(appliedExcludedIds()).toEqual(['d1', 'd0']);
        });

        it('should do nothing when an in progress item is not a dependency', () => {
            $publishOrRequestDialog.setKey('inProgressIds', toIds('d0', 'main'));

            excludePublishOrRequestInProgress();

            expect(excludedIds()).toEqual([]);
            expect(mockLoad).not.toHaveBeenCalled();
        });

        it('should do nothing when an in progress dependency is required', () => {
            $publishOrRequestDialog.setKey('requiredDependantIds', toIds('d0'));
            $publishOrRequestDialog.setKey('inProgressIds', toIds('d0', 'd1'));

            excludePublishOrRequestInProgress();

            expect(excludedIds()).toEqual([]);
            expect(mockLoad).not.toHaveBeenCalled();
        });

        it('should do nothing when nothing is in progress', () => {
            excludePublishOrRequestInProgress();

            expect(mockLoad).not.toHaveBeenCalled();
        });
    });

    describe('excludePublishOrRequestInvalid', () => {
        it('should untick the invalid dependencies, apply it and load again', () => {
            $publishOrRequestDialog.setKey('invalidIds', toIds('d1'));

            excludePublishOrRequestInvalid();

            expect(excludedIds()).toEqual(['d1']);
            expect(appliedExcludedIds()).toEqual(['d1']);
            expect(mockLoad).toHaveBeenCalledOnce();
        });

        it('should do nothing when an invalid item cannot be unticked', () => {
            $publishOrRequestDialog.setKey('invalidIds', toIds('d1', 'main'));

            excludePublishOrRequestInvalid();

            expect(excludedIds()).toEqual([]);
            expect(mockLoad).not.toHaveBeenCalled();
        });
    });

    describe('excludePublishOrRequestNotPublishable', () => {
        it('should untick the dependencies the user cannot publish, apply it and load again', () => {
            $publishOrRequestDialog.setKey('notPublishableIds', toIds('d2'));

            excludePublishOrRequestNotPublishable();

            expect(excludedIds()).toEqual(['d2']);
            expect(appliedExcludedIds()).toEqual(['d2']);
            expect(mockLoad).toHaveBeenCalledOnce();
        });

        it('should do nothing when one of those items cannot be unticked', () => {
            $publishOrRequestDialog.setKey('notPublishableIds', toIds('d2', 'main'));

            excludePublishOrRequestNotPublishable();

            expect(excludedIds()).toEqual([]);
            expect(mockLoad).not.toHaveBeenCalled();
        });
    });

    describe('markPublishOrRequestInProgressAsReady', () => {
        it('should mark the in progress items as ready and load again', async () => {
            $publishOrRequestDialog.setKey('inProgressIds', toIds('main', 'd0'));

            await markPublishOrRequestInProgressAsReady();

            expect(mockMarkAsReady.mock.calls[0][0].map(String)).toEqual(['main', 'd0']);
            expect(mockNotifyInfo).toHaveBeenCalledWith('notify.item.markedAsReady.multiple 2');
            expect(mockLoad).toHaveBeenCalledOnce();
        });

        it('should name the item when it is a single one', async () => {
            $publishOrRequestDialog.setKey('inProgressIds', toIds('main'));

            await markPublishOrRequestInProgressAsReady();

            expect(mockNotifyInfo).toHaveBeenCalledWith('notify.item.markedAsReady Main');
        });

        it('should show the dialog as loading while the items are marked', async () => {
            $publishOrRequestDialog.setKey('inProgressIds', toIds('d0'));

            const marking = markPublishOrRequestInProgressAsReady();

            expect($publishOrRequestDialog.get().loading).toBe(true);
            await marking;
        });

        it('should tell the failure and stop loading when the items cannot be marked', async () => {
            $publishOrRequestDialog.setKey('inProgressIds', toIds('d0'));
            mockMarkAsReady.mockReturnValue(errAsync(new Error('boom')));

            await markPublishOrRequestInProgressAsReady();

            expect(mockNotifyError).toHaveBeenCalledWith('notify.item.markedAsReady.error 1');
            expect($publishOrRequestDialog.get().loading).toBe(false);
            expect(mockLoad).not.toHaveBeenCalled();
        });

        it('should leave the dialog alone when it was closed meanwhile', async () => {
            $publishOrRequestDialog.setKey('inProgressIds', toIds('d0'));

            const marking = markPublishOrRequestInProgressAsReady();
            $publishOrRequestDialog.set({ ...INITIAL_PUBLISH_OR_REQUEST_DIALOG_STATE });
            await marking;

            expect(mockNotifyInfo).not.toHaveBeenCalled();
            expect(mockLoad).not.toHaveBeenCalled();
        });

        it('should do nothing while loading or when nothing is in progress', async () => {
            await markPublishOrRequestInProgressAsReady();

            $publishOrRequestDialog.setKey('inProgressIds', toIds('d0'));
            $publishOrRequestDialog.setKey('loading', true);
            await markPublishOrRequestInProgressAsReady();

            expect(mockMarkAsReady).not.toHaveBeenCalled();
        });
    });
});
