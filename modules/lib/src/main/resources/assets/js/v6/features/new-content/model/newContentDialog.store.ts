import { showError, showSuccess } from '@enonic/lib-admin-ui/notify/MessageBus';
import { type ContentTypeName } from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import { type ContentTypeSummary } from '@enonic/lib-admin-ui/schema/content/ContentTypeSummary';
import { i18n } from '@enonic/lib-admin-ui/util/Messages';
import { computed, listenKeys, map, task } from 'nanostores';
import { errAsync } from 'neverthrow';
import { type ContentSummary } from '../../../../app/content/ContentSummary';
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

type UploadOptions = {
    dataTransfer: DataTransfer;
    parentContent?: ContentSummary;
};

//
// * Store State
//

type NewContentDialogStore = {
    // Dialog state
    open: boolean;
    //loading: boolean;
    //failed: boolean;
    inputValue: string;
    selectedTab: string;
    isDragging: boolean;
    isMediaAllowed: boolean;
    // Content
    parentContent?: ContentSummary;
    baseContentTypes: ContentTypeSummary[];
    suggestedContentTypes: ContentTypeSummary[];
};

const initialState: NewContentDialogStore = {
    open: false,
    //loading: false,
    //failed: false,
    inputValue: '',
    selectedTab: 'all',
    isDragging: false,
    isMediaAllowed: false,
    parentContent: undefined,
    baseContentTypes: [],
    suggestedContentTypes: [],
};

export const $newContentDialog = map<NewContentDialogStore>(structuredClone(initialState));

// Filtered lists are derived from the loaded types and the current search text,
// so they stay consistent regardless of when the async load completes.
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

listenKeys($newContentDialog, ['open', 'parentContent'], ({ open, parentContent }) => {
    const activeProject = $activeProject.get();

    if (!open || !activeProject) return;

    const loadId = ++loadCounter;

    task(async () => {
        const allContentTypes = await ContentTypesHelper.getAvailableContentTypes({
            contentId: parentContent?.getContentId(),
            project: activeProject,
        });

        const aggregatedContentTypes = await ContentTypesHelper.getAggregatedTypesByContent(
            parentContent,
            activeProject,
        );

        // Discard a stale response if the dialog was closed or reopened while loading
        if (loadId !== loadCounter || !$newContentDialog.get().open) return;

        const baseContentTypes = getBaseContentTypes(allContentTypes);
        const suggestedContentTypes = getSuggestedContentTypes(allContentTypes, aggregatedContentTypes);
        const isMediaAllowed = allContentTypes.some((type) => type.getContentTypeName().isDescendantOfMedia());

        $newContentDialog.setKey('isMediaAllowed', isMediaAllowed);
        $newContentDialog.setKey('baseContentTypes', baseContentTypes);
        $newContentDialog.setKey('suggestedContentTypes', suggestedContentTypes);
    }).catch((error) => {
        console.error(error);
    });
});

//
// * Public API
//

export const openNewContentDialog = (parentContent?: ContentSummary): void => {
    $newContentDialog.set({
        ...structuredClone(initialState),
        open: true,
        parentContent,
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

// TODO: replace places invoking this function with the useUploadMedia hook
export async function uploadMediaFiles({ dataTransfer, parentContent }: UploadOptions): Promise<void> {
    if (dataTransfer.files.length === 0) return;

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
            onProgress: (id, progress) => updateUploadProgress(id, progress),
        });
    });

    const results = await Promise.all(tasks.map((task) => task.match(onEachSuccess, onEachError)));

    if (results.some(Boolean)) {
        await revealUploadedContent(parentContent);
    }
}

// TODO: replace places invoking this function with the useUploadMedia hook
export async function uploadDragImages({ dataTransfer, parentContent }: UploadOptions) {
    const htmlData = dataTransfer.getData('text/html');
    const imgSources = extractImageSources(htmlData);

    if (imgSources.length === 0) return;

    const tasks = imgSources.map((src) => {
        const id = src;
        const name = generateUniqueName(src);
        const parentId = parentContent?.getContentId()?.toString() ?? null;

        addUpload(id, name, parentId);

        const params: UploadRemoteImageOptions = {
            id,
            imageSource: src,
            parentContent,
            onProgress: (id, progress) => updateUploadProgress(id, progress),
        };

        // Not allowed
        if (src.startsWith('data:')) {
            return errAsync(new UploadError(id, i18n('notify.upload.dataUri.notAllowed')));
        }

        return uploadRemoteImage(params);
    });

    const results = await Promise.all(tasks.map((task) => task.match(onEachSuccess, onEachError)));

    if (results.some(Boolean)) {
        await revealUploadedContent(parentContent);
    }
}

//
// * Helpers
//

function filterByTitle(contentTypes: ContentTypeSummary[], searchText: string): ContentTypeSummary[] {
    if (searchText.length === 0) return contentTypes;

    const searchTextLower = searchText.toLowerCase();
    return contentTypes.filter((contentType) => contentType.getTitle().toLowerCase().includes(searchTextLower));
}

function getBaseContentTypes(contentTypes: ContentTypeSummary[]): ContentTypeSummary[] {
    return contentTypes
        .filter((contentType) => !contentType.getContentTypeName().isDescendantOfMedia())
        .sort((a, b) => a.getTitle().localeCompare(b.getTitle()));
}

function getSuggestedContentTypes(
    contentTypes: ContentTypeSummary[],
    aggregations: AggregateContentTypesResult,
): ContentTypeSummary[] {
    const DEFAULT_MAX_ITEMS = 100;

    const isAllowedContentType = (contentType: ContentTypeName) =>
        !contentType.isMedia() && !contentType.isDescendantOfMedia() && !contentType.isFragment();

    const allowedContentTypeAggregations: ContentTypeAggregation[] = aggregations
        .getAggregations()
        .filter((aggregation: ContentTypeAggregation) => isAllowedContentType(aggregation.getContentType()));

    return allowedContentTypeAggregations
        .slice(0, DEFAULT_MAX_ITEMS)
        .sort((a, b) => b.getCount() - a.getCount())
        .map((aggregation) =>
            contentTypes.find((type: ContentTypeSummary) => type.getName() === aggregation.getContentType().toString()),
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

function onEachSuccess(success: UploadMediaSuccess): boolean {
    removeUpload(success.mediaIdentifier);
    showSuccess(i18n('notify.upload.success', success.mediaIdentifier));
    return true;
}

function onEachError(error: UploadError): boolean {
    console.error(error);
    removeUpload(error.mediaIdentifier);
    showError(i18n('notify.upload.error', error.mediaIdentifier, error.message));
    return false;
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
