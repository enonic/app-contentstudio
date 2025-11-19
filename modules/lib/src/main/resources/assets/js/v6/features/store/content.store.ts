import {computed, map} from 'nanostores';
import {ContentSummaryAndCompareStatus} from '../../../app/content/ContentSummaryAndCompareStatus';

type ContentStore = {
    isLoading: boolean;
    contents: Readonly<ContentSummaryAndCompareStatus>[];
    selectionMode: 'multiple' | 'highlight';
    selectedContentIds: Readonly<string>[];
};

//
// * Store
//

/**
 * Central content store.
 *
 * - isLoading: Indicates if contents are being fetched.
 * - contents: Array of loaded ContentSummaryAndCompareStatus objects.
 * - selectionMode: 'multiple' for multi-select, 'highlight' for single active item.
 * - selectedContentIds: For 'highlight', a single id of the highlighted content; for 'multiple', ids of all selected contents.
 */
export const $contentStore = map<ContentStore>({
    isLoading: false,
    contents: [],
    selectionMode: 'multiple',
    selectedContentIds: [],
});

//
// * Computed stores
//

export const $selectionMode = computed($contentStore, (store) => store.selectionMode);

export const $numberOfSelectedContents = computed($contentStore, (store) => store.selectedContentIds.length);

export const $isLoading = computed($contentStore, (store) => store.isLoading);

export const $isAllSelected = computed($contentStore, (store) => {
    if (store.contents.length === 0) return false;

    return store.contents.every((c) => store.selectedContentIds.includes(c.getId()));
});

export const $isNoneSelected = computed($numberOfSelectedContents, (count) => count === 0);

//
// * Utilities
//

/**
 * Set the selection mode to 'multiple', allowing multiple contents to be selected.
 */
export function setSelectionModeAsMultiple(): void {
    $contentStore.setKey('selectionMode', 'multiple');
}

/**
 * Set the selection mode to 'highlight', allowing only a single content to be selected.
 */
export function setSelectionModeAsHighlight(): void {
    $contentStore.setKey('selectionMode', 'highlight');
}

/**
 * Add a single content item to the store if not already present.
 */
export function addContent(content: Readonly<ContentSummaryAndCompareStatus>): void {
    addContents([content]);
}

/**
 * Add multiple content items to the store, if not already present. */
export function addContents(contents: Readonly<ContentSummaryAndCompareStatus>[]): void {
    const store = $contentStore.get();
    const existingIds = new Set(store.contents.map((c) => c.getId()));
    const newContents = contents.filter((c) => !existingIds.has(c.getId()));
    const updatedContents = [...store.contents, ...newContents];

    $contentStore.setKey('contents', updatedContents);
}

/**
 * Remove a single content item from the store.
 */
export function removeContent(content: Readonly<ContentSummaryAndCompareStatus>): void {
    removeContents([content]);
}

/**
 * Remove multiple content items from the store.
 */
export function removeContents(contents: Readonly<ContentSummaryAndCompareStatus>[]): void {
    const store = $contentStore.get();
    const idsToRemove = new Set(contents.map((c) => c.getId()));
    const updatedContents = store.contents.filter((c) => !idsToRemove.has(c.getId()));

    $contentStore.setKey('contents', updatedContents);
}

/**
 * Select all contents currently in the store (sets selection mode to 'multiple').
 */
export function selectAllContent(): void {
    setSelectionModeAsMultiple();

    const store = $contentStore.get();

    const updatedSelectedContentIds = store.contents.map((c) => c.getId());

    $contentStore.setKey('selectedContentIds', updatedSelectedContentIds);
}

/**
 * Deselect all selected contents.
 */
export function deselectAllContent(): void {
    $contentStore.setKey('selectedContentIds', []);
}

/**
 * Select a single content item.
 * In 'highlight' mode: only the given content is selected.
 * In 'multiple' mode: adds the content to the selection if not already selected.
 * @param content - Content to select
 */
export function selectContent(content: Readonly<ContentSummaryAndCompareStatus>): void {
    const store = $contentStore.get();

    if (store.selectionMode === 'highlight') {
        $contentStore.setKey('selectedContentIds', [content.getId()]);
    } else if (store.selectionMode === 'multiple') {
        if (store.selectedContentIds.includes(content.getId())) {
            return;
        }

        const updatedSelectedContentIds = [...store.selectedContentIds, content.getId()];

        $contentStore.setKey('selectedContentIds', updatedSelectedContentIds);
    }
}

/**
 * Deselect a single content item.
 */
export function deselectContent(content: Readonly<ContentSummaryAndCompareStatus>): void {
    const store = $contentStore.get();

    const updatedSelectedContentIds = store.selectedContentIds.filter((id) => id !== content.getId());

    $contentStore.setKey('selectedContentIds', updatedSelectedContentIds);
}

// TODO: Enonic UI - Implement
export function reload(): void {}

//
// * Internal
//

// TODO: Enonic UI - Implement
function fetchAndUpdateContents(referenceContent: Readonly<ContentSummaryAndCompareStatus> | null = null): void {}

// Initial fetch from root
fetchAndUpdateContents(null);
