import {showError, showSuccess} from '@enonic/lib-admin-ui/notify/MessageBus';
import {type ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {type ContentTypeSummary} from '@enonic/lib-admin-ui/schema/content/ContentTypeSummary';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {listenKeys, map, task} from 'nanostores';
import {errAsync} from 'neverthrow';
import {type ContentSummary} from '../../../../app/content/ContentSummary';
import {type AggregateContentTypesResult, type ContentTypeAggregation} from '../../../../app/resource/AggregateContentTypesResult';
import {ContentTypesHelper} from '../../../../app/util/ContentTypesHelper';
import {fetchRootChildrenFiltered} from '../../api/content-fetcher';
import {
    type UploadDataUrlImageOptions,
    type UploadMediaError,
    uploadMediaFile,
    type UploadMediaSuccess,
    uploadRemoteImage,
} from '../../api/uploadMedia';
import {generateUniqueName} from '../../utils/image/generateUniqueName';
import {$activeProject} from '../projects.store';
import {resetTree} from '../tree-list.store';
import {addUpload, removeUpload, updateUploadProgress} from '../uploads.store';

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
    // Content
    parentContent?: ContentSummary;
    baseContentTypes: ContentTypeSummary[];
    suggestedContentTypes: ContentTypeSummary[];
    filteredBaseContentTypes: ContentTypeSummary[];
    filteredSuggestedContentTypes: ContentTypeSummary[];
};

const initialState: NewContentDialogStore = {
    open: false,
    //loading: false,
    //failed: false,
    inputValue: '',
    selectedTab: 'all',
    isDragging: false,
    parentContent: undefined,
    baseContentTypes: [],
    suggestedContentTypes: [],
    filteredBaseContentTypes: [],
    filteredSuggestedContentTypes: [],
};

export const $newContentDialog = map<NewContentDialogStore>(structuredClone(initialState));

//
// * Listeners
//

listenKeys($newContentDialog, ['open', 'parentContent'], ({open, parentContent}) => {
    const activeProject = $activeProject.get();

    if (!open || !activeProject) return;

    task(async () => {
        const allContentTypes = await ContentTypesHelper.getAvailableContentTypes({
            contentId: parentContent?.getContentId(),
            project: activeProject,
        });

        const aggregatedContentTypes = await ContentTypesHelper.getAggregatedTypesByContent(
            parentContent,
            activeProject
        );

        const baseContentTypes = getBaseContentTypes(allContentTypes);
        const suggestedContentTypes = getSuggestedContentTypes(allContentTypes, aggregatedContentTypes);

        $newContentDialog.setKey('baseContentTypes', baseContentTypes);
        $newContentDialog.setKey('filteredBaseContentTypes', baseContentTypes);
        $newContentDialog.setKey('suggestedContentTypes', suggestedContentTypes);
        $newContentDialog.setKey('filteredSuggestedContentTypes', suggestedContentTypes);
    }).catch((error) => {
        console.error(error);
    });
});

listenKeys($newContentDialog, ['inputValue'], ({inputValue, baseContentTypes, suggestedContentTypes}) => {
    if (!inputValue || inputValue.length === 0) {
        $newContentDialog.setKey('filteredBaseContentTypes', baseContentTypes);
        $newContentDialog.setKey('filteredSuggestedContentTypes', suggestedContentTypes);
        return;
    }

    const filteredBaseContentTypes = baseContentTypes.filter((contentType) =>
        contentType.getTitle().toLowerCase().includes(inputValue.toLowerCase())
    );
    const filteredSuggestedContentTypes = suggestedContentTypes.filter((contentType) =>
        contentType.getTitle().toLowerCase().includes(inputValue.toLowerCase())
    );

    $newContentDialog.setKey('filteredBaseContentTypes', filteredBaseContentTypes);
    $newContentDialog.setKey('filteredSuggestedContentTypes', filteredSuggestedContentTypes);
});
//

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
export async function uploadMediaFiles({dataTransfer, parentContent}: UploadOptions): Promise<void> {
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

    await Promise.all(tasks.map((task) => task.match(onEachSuccess, onEachError)));
}

// TODO: replace places invoking this function with the useUploadMedia hook
export async function uploadDragImages({dataTransfer, parentContent}: UploadOptions) {
    const htmlData = dataTransfer.getData('text/html');
    const imgSources = extractImageSources(htmlData);

    if (imgSources.length === 0) return;

    const tasks = imgSources.map((src) => {
        const id = src;
        const name = generateUniqueName(src);
        const parentId = parentContent?.getContentId()?.toString() ?? null;

        addUpload(id, name, parentId);

        const params: UploadDataUrlImageOptions = {
            id,
            name,
            imageSource: src,
            parentContent,
            onProgress: (id, progress) => updateUploadProgress(id, progress),
        };

        // Not allowed
        if (src.startsWith('data:')) {
            return errAsync({mediaIdentifier: id, message: i18n('notify.upload.dataUri.notAllowed')});
        }

        return uploadRemoteImage(params);
    });

    await Promise.all(tasks.map((task) => task.match(onEachSuccess, onEachError)));
}

//
// * Helpers
//

function getBaseContentTypes(contentTypes: ContentTypeSummary[]): ContentTypeSummary[] {
    return contentTypes
        .filter((contentType) => !contentType.getContentTypeName().isDescendantOfMedia())
        .sort((a, b) => a.getTitle().localeCompare(b.getTitle()));
}

function getSuggestedContentTypes(contentTypes: ContentTypeSummary[], aggregations: AggregateContentTypesResult): ContentTypeSummary[] {
    const DEFAULT_MAX_ITEMS = 100;

    const isAllowedContentType = (contentType: ContentTypeName) =>
        !contentType.isMedia() && !contentType.isDescendantOfMedia() && !contentType.isFragment();

    const allowedContentTypeAggregations: ContentTypeAggregation[] = aggregations
        .getAggregations()
        .filter((aggregation: ContentTypeAggregation) => isAllowedContentType(aggregation.getContentType()));

    return allowedContentTypeAggregations
        .slice(0, DEFAULT_MAX_ITEMS)
        .sort((a, b) => b.getCount() - a.getCount())
        .map((aggregation) => contentTypes.find((type: ContentTypeSummary) => type.getName() === aggregation.getContentType().toString()))
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

function onEachSuccess(success: UploadMediaSuccess) {
    removeUpload(success.mediaIdentifier);
    resetTree();
    void fetchRootChildrenFiltered();
    showSuccess(i18n('notify.upload.success', success.mediaIdentifier));
}

function onEachError(error: UploadMediaError) {
    console.error(error);
    removeUpload(error.mediaIdentifier);
    showError(i18n('notify.upload.error', error.mediaIdentifier, error.message));
}
