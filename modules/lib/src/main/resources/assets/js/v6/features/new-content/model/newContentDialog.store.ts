import { notifyError, notifySuccess } from '../../../shared/notifications';
import { type ContentTypeSummary } from '../../../entities/schema';
import { computed, listenKeys, map, task } from 'nanostores';
import { errAsync } from 'neverthrow';
import { i18n } from '../../../shared/i18n';
import { type Content } from '../../../../app/content/Content';
import { type ContentSummary } from '../../../../app/content/ContentSummary';
import { type Project } from '../../../../app/settings/data/project/Project';
import {
    type AggregateContentTypesResult,
    type ContentTypeAggregation,
} from '../../../../app/resource/AggregateContentTypesResult';
import { ContentTypesHelper } from '../../../../app/util/ContentTypesHelper';
import { reloadParentChildren, expandNode, hasTreeNode, isNodeExpanded } from '../../../entities/content';
import {
    uploadMediaFile,
    type UploadMediaSuccess,
    uploadRemoteImage,
    type UploadRemoteImageOptions,
} from '../../../entities/content/api/uploadMedia.api';
import { UploadError } from '../../../shared/api';
import { generateUniqueName } from '../../../shared/lib/image/generateUniqueName';
import { $activeProject } from '../../../entities/project/activeProject.store';
import { addUpload, removeUpload, updateUploadProgress } from '../../../entities/content/model/uploads.store';
import { CONTENT_TYPE, isDescendantOfMedia } from '../../../shared/lib/cms/schema/contentTypeName';
import { loadCreatableContentTypes } from './creatableContentTypes';

type UploadOptions = {
    dataTransfer: DataTransfer;
    parentContent?: ContentSummary;
    /** Project to upload into; defaults to the active project. */
    projectName?: string;
    /** Receives the uploaded contents instead of the browse tree revealing them, for a host without a tree. */
    onUploaded?: (contents: Content[]) => void;
};

type OpenNewContentDialogOptions = {
    allowedContentTypes?: string[];
    contentTypes?: ContentTypeSummary[];
    /** Project to load the types in; defaults to the active project. */
    project?: Readonly<Project>;
    /** Handles a picked type instead of firing `NewContentEvent`, for a host without the content app's listeners. */
    onTypeSelected?: (contentType: ContentTypeSummary) => void;
    /** Receives what the Media tab uploaded instead of the browse tree revealing it. */
    onUploaded?: (contents: Content[]) => void;
};

//
// * Store State
//

type NewContentDialogStore = {
    // Dialog state
    open: boolean;
    loading: boolean;
    inputValue: string;
    selectedTab: string;
    isDragging: boolean;
    isMediaAllowed: boolean;
    // Content
    project?: Readonly<Project>;
    parentContent?: ContentSummary;
    allowedContentTypes?: string[];
    preloadedContentTypes?: ContentTypeSummary[];
    baseContentTypes: ContentTypeSummary[];
    suggestedContentTypes: ContentTypeSummary[];
    onTypeSelected?: (contentType: ContentTypeSummary) => void;
    onUploaded?: (contents: Content[]) => void;
};

const initialState: NewContentDialogStore = {
    open: false,
    loading: false,
    inputValue: '',
    selectedTab: 'all',
    isDragging: false,
    isMediaAllowed: false,
    project: undefined,
    parentContent: undefined,
    allowedContentTypes: undefined,
    preloadedContentTypes: undefined,
    baseContentTypes: [],
    suggestedContentTypes: [],
    onTypeSelected: undefined,
    onUploaded: undefined,
};

export const $newContentDialog = map<NewContentDialogStore>(structuredClone(initialState));
export const $filteredBaseContentTypes = computed($newContentDialog, ({ baseContentTypes, inputValue }) =>
    filterByTitle(baseContentTypes, inputValue),
);

export const $filteredSuggestedContentTypes = computed($newContentDialog, ({ suggestedContentTypes, inputValue }) =>
    filterByTitle(suggestedContentTypes, inputValue),
);

//
// * Listeners
//

let loadCounter = 0;

listenKeys($newContentDialog, ['open', 'parentContent'], (state) => {
    const { open, parentContent, allowedContentTypes, preloadedContentTypes } = state;
    const project = state.project ?? $activeProject.get();

    if (!open || !project) return;

    const loadId = ++loadCounter;
    $newContentDialog.setKey('loading', true);

    task(async () => {
        const allContentTypes =
            preloadedContentTypes ??
            (await loadCreatableContentTypes({
                contentId: parentContent?.getContentId(),
                allowedContentTypes,
                project,
            }));

        const aggregatedContentTypes = await ContentTypesHelper.getAggregatedTypesByContent(parentContent, project);

        // Discard a stale response if the dialog was closed or reopened while loading
        if (loadId !== loadCounter || !$newContentDialog.get().open) return;

        const baseContentTypes = getBaseContentTypes(allContentTypes);
        const suggestedContentTypes = getSuggestedContentTypes(allContentTypes, aggregatedContentTypes);
        const isMediaAllowed = allContentTypes.some((type) => isDescendantOfMedia(type.name));

        $newContentDialog.setKey('isMediaAllowed', isMediaAllowed);
        $newContentDialog.setKey('baseContentTypes', baseContentTypes);
        $newContentDialog.setKey('suggestedContentTypes', suggestedContentTypes);

        // Only media can be created here: start on the upload tab instead of an empty list.
        if (baseContentTypes.length === 0 && isMediaAllowed) {
            $newContentDialog.setKey('selectedTab', 'media');
        }

        $newContentDialog.setKey('loading', false);
    }).catch((error) => {
        console.error(error);

        // Stop the spinner only if this load is still the current one
        if (loadId === loadCounter) {
            $newContentDialog.setKey('loading', false);
        }
    });
});

//
// * Public API
//

export const openNewContentDialog = (parentContent?: ContentSummary, options?: OpenNewContentDialogOptions): void => {
    $newContentDialog.set({
        ...structuredClone(initialState),
        open: true,
        project: options?.project,
        parentContent,
        allowedContentTypes: options?.allowedContentTypes,
        preloadedContentTypes: options?.contentTypes,
        onTypeSelected: options?.onTypeSelected,
        onUploaded: options?.onUploaded,
    });
};

export const closeNewContentDialog = (): void => {
    $newContentDialog.set(structuredClone(initialState));
};

export const setInputValue = (value: string): void => {
    $newContentDialog.setKey('inputValue', value);
};

export const setSelectedTab = (tab: string): void => {
    $newContentDialog.setKey('selectedTab', tab);
};

export const setIsDragging = (isDragging: boolean): void => {
    $newContentDialog.setKey('isDragging', isDragging);
};

/**
 * Uploads the files and the dragged web images of a drop, then hands the contents to the
 * host or reveals them in the browse tree, once for the whole drop.
 */
// TODO: replace with the useUploadMedia hook
export async function uploadDroppedMedia(options: UploadOptions): Promise<void> {
    const [files, images] = await Promise.all([uploadMediaFiles(options), uploadDragImages(options)]);
    const contents = [...files, ...images];

    if (options.onUploaded) {
        options.onUploaded(contents);
    } else if (contents.length > 0) {
        await revealUploadedContent(options.parentContent);
    }
}

async function uploadMediaFiles({ dataTransfer, parentContent, projectName }: UploadOptions): Promise<Content[]> {
    if (dataTransfer.files.length === 0) return [];

    const files = Array.from(dataTransfer.files);

    const tasks = files.map((file) => {
        const id = file.name;
        const name = file.name;
        const parentId = parentContent?.getContentId()?.toString() ?? null;

        addUpload(id, name, parentId);

        return uploadMediaFile({
            id,
            file,
            parentContent,
            projectName,
            onProgress: (id, progress) => updateUploadProgress(id, progress),
        });
    });

    const results = await Promise.all(tasks.map((task) => task.match(onEachSuccess, onEachError)));

    return results.filter((content): content is Content => content != null);
}

async function uploadDragImages({ dataTransfer, parentContent, projectName }: UploadOptions): Promise<Content[]> {
    const htmlData = dataTransfer.getData('text/html');
    const imgSources = extractImageSources(htmlData);

    if (imgSources.length === 0) return [];

    const tasks = imgSources.map((src) => {
        const id = src;
        const name = generateUniqueName(src);
        const parentId = parentContent?.getContentId()?.toString() ?? null;

        addUpload(id, name, parentId);

        const params: UploadRemoteImageOptions = {
            id,
            imageSource: src,
            parentContent,
            projectName,
            onProgress: (id, progress) => updateUploadProgress(id, progress),
        };

        // Not allowed
        if (src.startsWith('data:')) {
            return errAsync(new UploadError(id, i18n('notify.upload.dataUri.notAllowed')));
        }

        return uploadRemoteImage(params);
    });

    const results = await Promise.all(tasks.map((task) => task.match(onEachSuccess, onEachError)));

    return results.filter((content): content is Content => content != null);
}

//
// * Helpers
//

function filterByTitle(contentTypes: ContentTypeSummary[], searchText: string): ContentTypeSummary[] {
    if (searchText.length === 0) return contentTypes;

    const searchTextLower = searchText.toLowerCase();
    return contentTypes.filter((contentType) => contentType.title.toLowerCase().includes(searchTextLower));
}

function getBaseContentTypes(contentTypes: ContentTypeSummary[]): ContentTypeSummary[] {
    return contentTypes
        .filter((contentType) => !isDescendantOfMedia(contentType.name))
        .sort((a, b) => a.title.localeCompare(b.title));
}

function getSuggestedContentTypes(
    contentTypes: ContentTypeSummary[],
    aggregations: AggregateContentTypesResult,
): ContentTypeSummary[] {
    const DEFAULT_MAX_ITEMS = 100;

    const isAllowedContentType = (contentType: string) =>
        contentType !== CONTENT_TYPE.MEDIA &&
        !isDescendantOfMedia(contentType) &&
        contentType !== CONTENT_TYPE.FRAGMENT;

    const allowedContentTypeAggregations: ContentTypeAggregation[] = aggregations
        .getAggregations()
        .filter((aggregation: ContentTypeAggregation) => isAllowedContentType(aggregation.getContentType().toString()));

    return allowedContentTypeAggregations
        .slice(0, DEFAULT_MAX_ITEMS)
        .sort((a, b) => b.getCount() - a.getCount())
        .map((aggregation) =>
            contentTypes.find((type: ContentTypeSummary) => type.name === aggregation.getContentType().toString()),
        )
        .filter(Boolean);
}

function extractImageSources(htmlData: string): string[] {
    if (!htmlData || !/<img.*\ssrc="/i.test(htmlData)) {
        return [];
    }

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlData;
    const images = tempDiv.getElementsByTagName('img');

    return Array.from(images)
        .map((img) => img.getAttribute('src'))
        .filter((src): src is string => src != null);
}

function onEachSuccess(success: UploadMediaSuccess): Content {
    removeUpload(success.mediaIdentifier);
    notifySuccess(i18n('notify.upload.success', success.mediaIdentifier));
    return success.content;
}

function onEachError(error: UploadError): undefined {
    console.error(error);
    removeUpload(error.mediaIdentifier);
    notifyError(i18n('notify.upload.error', error.mediaIdentifier, error.message));
    return undefined;
}

// Reveal uploaded items under their target parent: expand it (unless already
// expanded) and reload its children. The server owns the child order (it may be
// manual), so we refetch rather than insert locally — same approach as duplication.
async function revealUploadedContent(parentContent?: ContentSummary): Promise<void> {
    const parentId = parentContent?.getContentId()?.toString() ?? null;

    if (parentId && hasTreeNode(parentId) && !isNodeExpanded(parentId)) {
        expandNode(parentId);
    }

    await reloadParentChildren(parentId).catch(() => undefined);
}
