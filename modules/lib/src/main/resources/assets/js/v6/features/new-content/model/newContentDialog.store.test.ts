import { ContentTypeSummaryBuilder } from '@enonic/lib-admin-ui/schema/content/ContentTypeSummary';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentId } from '../../../../app/content/ContentId';
import { ContentPath } from '../../../../app/content/ContentPath';
import { ContentSummaryBuilder } from '../../../../app/content/ContentSummary';
import { Project } from '../../../../app/settings/data/project/Project';
import { flushPromises } from '../../../shared/lib/test/dialog.store.test.utils';

const { mockGetAvailableContentTypes, mockGetAggregatedTypesByContent } = vi.hoisted(() => ({
    mockGetAvailableContentTypes: vi.fn(),
    mockGetAggregatedTypesByContent: vi.fn(),
}));

vi.mock('@enonic/lib-admin-ui/notify/MessageBus', () => ({
    showError: vi.fn(),
    showSuccess: vi.fn(),
}));
vi.mock('../../../../app/util/ContentTypesHelper', () => ({
    ContentTypesHelper: {
        getAvailableContentTypes: mockGetAvailableContentTypes,
        getAggregatedTypesByContent: mockGetAggregatedTypesByContent,
    },
}));
vi.mock('../../../entities/content', () => ({
    reloadParentChildren: vi.fn(),
    expandNode: vi.fn(),
    hasTreeNode: vi.fn(),
    isNodeExpanded: vi.fn(),
}));
vi.mock('../../../entities/content/api/uploadMedia.api', () => ({
    uploadMediaFile: vi.fn(),
    uploadRemoteImage: vi.fn(),
}));
vi.mock('../../../entities/project/activeProject.store', async () => {
    const { atom } = await import('nanostores');
    return { $activeProject: atom(undefined) };
});

import { $activeProject } from '../../../entities/project/activeProject.store';
import { $newContentDialog, closeNewContentDialog, openNewContentDialog } from './newContentDialog.store';

const createContentType = (name: string, title: string) => {
    const builder = new ContentTypeSummaryBuilder();
    builder.name = name;
    builder.title = title;
    return builder.build();
};

const person = createContentType('com.app:person', 'Person');
const movie = createContentType('com.app:movie', 'Movie');
const image = createContentType('media:image', 'Image');

const parent = new ContentSummaryBuilder()
    .setId('parent')
    .setContentId(new ContentId('parent'))
    .setPath(ContentPath.create().fromString('/parent').build())
    .build();

const project = Project.create().setName('project').build();

describe('newContentDialog.store', () => {
    beforeEach(() => {
        $activeProject.set(project);
        mockGetAvailableContentTypes.mockResolvedValue([movie, person]);
        mockGetAggregatedTypesByContent.mockResolvedValue({ getAggregations: () => [] });
    });

    afterEach(() => {
        closeNewContentDialog();
        vi.clearAllMocks();
    });

    describe('openNewContentDialog', () => {
        it('should request the available types for the parent without restrictions by default', async () => {
            openNewContentDialog(parent);
            await flushPromises();

            expect(mockGetAvailableContentTypes).toHaveBeenCalledOnce();
            expect(mockGetAvailableContentTypes).toHaveBeenCalledWith({
                contentId: parent.getContentId(),
                allowedContentTypes: undefined,
                project,
            });
            expect($newContentDialog.get().baseContentTypes).toEqual([movie, person]);
            expect($newContentDialog.get().loading).toBe(false);
        });

        it('should forward the allowed names to the content types request', async () => {
            openNewContentDialog(parent, { allowedContentTypes: ['com.app:person'] });
            await flushPromises();

            expect(mockGetAvailableContentTypes).toHaveBeenCalledWith({
                contentId: parent.getContentId(),
                allowedContentTypes: ['com.app:person'],
                project,
            });
            expect($newContentDialog.get().allowedContentTypes).toEqual(['com.app:person']);
        });

        it('should use the preloaded types instead of requesting them', async () => {
            openNewContentDialog(parent, { contentTypes: [movie, image, person] });
            await flushPromises();

            expect(mockGetAvailableContentTypes).not.toHaveBeenCalled();
            expect(mockGetAggregatedTypesByContent).toHaveBeenCalledWith(parent, project);

            const state = $newContentDialog.get();
            expect(state.baseContentTypes).toEqual([movie, person]);
            expect(state.isMediaAllowed).toBe(true);
            expect(state.loading).toBe(false);
        });

        it('should not allow media when the preloaded types have none', async () => {
            openNewContentDialog(parent, { contentTypes: [person] });
            await flushPromises();

            expect($newContentDialog.get().isMediaAllowed).toBe(false);
        });

        it('should drop the options of a previous opening', async () => {
            openNewContentDialog(parent, { allowedContentTypes: ['com.app:person'], contentTypes: [person] });
            await flushPromises();
            closeNewContentDialog();

            openNewContentDialog(parent);
            await flushPromises();

            const state = $newContentDialog.get();
            expect(state.allowedContentTypes).toBeUndefined();
            expect(state.preloadedContentTypes).toBeUndefined();
            expect(mockGetAvailableContentTypes).toHaveBeenCalledOnce();
            expect(mockGetAvailableContentTypes).toHaveBeenCalledWith({
                contentId: parent.getContentId(),
                allowedContentTypes: undefined,
                project,
            });
        });
    });
});
