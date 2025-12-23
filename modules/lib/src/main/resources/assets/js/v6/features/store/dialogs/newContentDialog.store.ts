import {listenKeys, map, task} from 'nanostores';
import {ContentSummaryAndCompareStatus} from '../../../../app/content/ContentSummaryAndCompareStatus';
import {ContentTypesHelper} from '../../../../app/util/ContentTypesHelper';
import {$activeProject} from '../projects.store';
import {Project} from '../../../../app/settings/data/project/Project';
import {ContentTypeSummary} from '.xp/dev/lib-admin-ui/schema/content/ContentTypeSummary';
import {
    AggregateContentTypesResult,
    ContentTypeAggregation,
} from '../../../../app/resource/AggregateContentTypesResult';
import {ContentTypeName} from '.xp/dev/lib-admin-ui/schema/content/ContentTypeName';

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
    // Content
    parentContent?: ContentSummaryAndCompareStatus;
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
    parentContent: undefined,
    baseContentTypes: [],
    suggestedContentTypes: [],
    filteredBaseContentTypes: [],
    filteredSuggestedContentTypes: [],
};

export const $newContentDialog = map<NewContentDialogStore>(structuredClone(initialState));

//
// * Derived State
//

//
// * Listeners
//
listenKeys($newContentDialog, ['open', 'parentContent'], ({open, parentContent}) => {
    const activeProject = $activeProject.get() as Project; // TODO: fix type

    if (!open || !activeProject) return;

    task(async () => {
        const allContentTypes = await ContentTypesHelper.getAvailableContentTypes({
            contentId: parentContent?.getContentId(),
            project: activeProject,
        });

        const aggregatedContentTypes = await ContentTypesHelper.getAggregatedTypesByContent(
            parentContent?.getContentSummary(),
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
        contentType.getDisplayName().toLowerCase().includes(inputValue.toLowerCase())
    );
    const filteredSuggestedContentTypes = suggestedContentTypes.filter((contentType) =>
        contentType.getDisplayName().toLowerCase().includes(inputValue.toLowerCase())
    );

    $newContentDialog.setKey('filteredBaseContentTypes', filteredBaseContentTypes);
    $newContentDialog.setKey('filteredSuggestedContentTypes', filteredSuggestedContentTypes);
});
//

//
// * Public API
//

export const openNewContentDialog = (parentContent?: ContentSummaryAndCompareStatus): void => {
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

//
// * Helpers
//

function getBaseContentTypes(contentTypes: ContentTypeSummary[]): ContentTypeSummary[] {
    return contentTypes
        .filter((contentType) => !contentType.getContentTypeName().isDescendantOfMedia())
        .sort((a, b) => a.getDisplayName().localeCompare(b.getDisplayName()));
}

function getSuggestedContentTypes(
    contentTypes: ContentTypeSummary[],
    aggregations: AggregateContentTypesResult
): ContentTypeSummary[] {
    const DEFAULT_MAX_ITEMS = 100; //2;

    const isAllowedContentType = (contentType: ContentTypeName) =>
        !contentType.isMedia() && !contentType.isDescendantOfMedia() && !contentType.isFragment();

    const allowedContentTypeAggregations: ContentTypeAggregation[] = aggregations
        .getAggregations()
        .filter((aggregation: ContentTypeAggregation) => isAllowedContentType(aggregation.getContentType()));

    return allowedContentTypeAggregations
        .slice(0, DEFAULT_MAX_ITEMS)
        .sort((a, b) => b.getCount() - a.getCount())
        .map((aggregation) =>
            contentTypes.find((type: ContentTypeSummary) => type.getName() === aggregation.getContentType().toString())
        )
        .filter(Boolean);
}
