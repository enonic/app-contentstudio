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

vi.mock('../../../shared/notifications', () => ({
    notifyError: vi.fn(),
    notifySuccess: vi.fn(),
}));
vi.mock('../../../../app/util/ContentTypesHelper', () => ({
    ContentTypesHelper: {
        getAggregatedTypesByContent: mockGetAggregatedTypesByContent,
    },
}));
vi.mock('./creatableContentTypes', () => ({
    loadCreatableContentTypes: mockGetAvailableContentTypes,
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

import { okAsync } from 'neverthrow';
import { type Content } from '../../../../app/content/Content';
import { reloadParentChildren } from '../../../entities/content';
import { uploadMediaFile } from '../../../entities/content/api/uploadMedia.api';
import { $activeProject } from '../../../entities/project/activeProject.store';
import {
    $newContentDialog,
    closeNewContentDialog,
    openNewContentDialog,
    uploadDroppedMedia,
} from './newContentDialog.store';
import { type ContentTypeSummary } from '../../../entities/schema';
import { type ContentTypeName } from '../../../shared/lib/cms/schema/contentTypeName';

const createContentType = (name: ContentTypeName, title: string): ContentTypeSummary => {
    return { name, title, abstract: false };
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

        it('should open on the media tab when only media types can be created', async () => {
            openNewContentDialog(parent, { contentTypes: [image] });
            await flushPromises();

            expect($newContentDialog.get().selectedTab).toBe('media');
        });

        it('should stay on the all tab when there is something besides media to create', async () => {
            openNewContentDialog(parent, { contentTypes: [image, person] });
            await flushPromises();

            expect($newContentDialog.get().selectedTab).toBe('all');
        });

        it('should not allow media when the preloaded types have none', async () => {
            openNewContentDialog(parent, { contentTypes: [person] });
            await flushPromises();

            expect($newContentDialog.get().isMediaAllowed).toBe(false);
        });

        it('should load the types in the given project instead of the active one', async () => {
            const other = Project.create().setName('other').build();

            openNewContentDialog(undefined, { project: other });
            await flushPromises();

            expect(mockGetAvailableContentTypes).toHaveBeenCalledWith({
                contentId: undefined,
                allowedContentTypes: undefined,
                project: other,
            });
            expect(mockGetAggregatedTypesByContent).toHaveBeenCalledWith(undefined, other);
        });

        it('should resolve the allowed names against the given application key when loading without a parent', async () => {
            openNewContentDialog(undefined, { allowedContentTypes: ['${app}:person'], applicationKey: 'com.app' });
            await flushPromises();

            expect(mockGetAvailableContentTypes).toHaveBeenCalledWith({
                contentId: undefined,
                allowedContentTypes: ['${app}:person'],
                applicationKey: 'com.app',
                project,
            });
        });

        it('should load the types in the given project when there is no active one', async () => {
            $activeProject.set(undefined);

            openNewContentDialog(undefined, { project, contentTypes: [person] });
            await flushPromises();

            expect(mockGetAggregatedTypesByContent).toHaveBeenCalledWith(undefined, project);
            expect($newContentDialog.get().loading).toBe(false);
        });

        it('should keep the handlers of the opening', async () => {
            const onTypeSelected = vi.fn();
            const onUploaded = vi.fn();

            openNewContentDialog(parent, { contentTypes: [person], onTypeSelected, onUploaded });
            await flushPromises();

            expect($newContentDialog.get().onTypeSelected).toBe(onTypeSelected);
            expect($newContentDialog.get().onUploaded).toBe(onUploaded);
        });

        it('should drop the options of a previous opening', async () => {
            openNewContentDialog(parent, {
                allowedContentTypes: ['com.app:person'],
                applicationKey: 'com.app',
                contentTypes: [person],
                project,
                onTypeSelected: vi.fn(),
                onUploaded: vi.fn(),
            });
            await flushPromises();
            closeNewContentDialog();

            openNewContentDialog(parent);
            await flushPromises();

            const state = $newContentDialog.get();
            expect(state.allowedContentTypes).toBeUndefined();
            expect(state.applicationKey).toBeUndefined();
            expect(state.preloadedContentTypes).toBeUndefined();
            expect(state.project).toBeUndefined();
            expect(state.onTypeSelected).toBeUndefined();
            expect(state.onUploaded).toBeUndefined();
            expect(mockGetAvailableContentTypes).toHaveBeenCalledOnce();
            expect(mockGetAvailableContentTypes).toHaveBeenCalledWith({
                contentId: parent.getContentId(),
                allowedContentTypes: undefined,
                project,
            });
        });
    });

    describe('uploadDroppedMedia', () => {
        const uploaded = { getId: () => 'm-1' } as unknown as Content;
        const drop = (files: File[]) => ({ files, getData: () => '' }) as unknown as DataTransfer;

        beforeEach(() => {
            vi.mocked(uploadMediaFile).mockReturnValue(okAsync({ mediaIdentifier: 'a.png', content: uploaded }));
            vi.mocked(reloadParentChildren).mockResolvedValue(undefined);
        });

        it('should upload into the given project root and hand the contents to the handler, not the tree', async () => {
            const onUploaded = vi.fn();

            await uploadDroppedMedia({
                dataTransfer: drop([new File(['x'], 'a.png')]),
                projectName: 'other',
                onUploaded,
            });

            expect(uploadMediaFile).toHaveBeenCalledWith(
                expect.objectContaining({ id: 'a.png', parentContent: undefined, projectName: 'other' }),
            );
            expect(onUploaded).toHaveBeenCalledOnce();
            expect(onUploaded).toHaveBeenCalledWith([uploaded]);
            expect(reloadParentChildren).not.toHaveBeenCalled();
        });

        it('should reveal the uploads in the tree when there is no handler', async () => {
            await uploadDroppedMedia({ dataTransfer: drop([new File(['x'], 'a.png')]) });

            expect(reloadParentChildren).toHaveBeenCalledWith(null);
        });

        it('should hand over an empty list when nothing was dropped', async () => {
            const onUploaded = vi.fn();

            await uploadDroppedMedia({ dataTransfer: drop([]), onUploaded });

            expect(uploadMediaFile).not.toHaveBeenCalled();
            expect(onUploaded).toHaveBeenCalledWith([]);
        });
    });
});
