import { computed } from 'nanostores';
import { $activeId as $_activeIdAtom } from './model/content-selection.store';
import { $filterRefreshNeeded as $_filterRefreshNeededAtom } from './model/filter-tree.store';
import { $isFilterActive as $_isFilterActiveAtom } from './model/active-tree.store';
import { $selection as $_selectionAtom } from './model/content-selection.store';
import { $isReloading as $_isReloadingAtom, $treeState as $_treeStateAtom } from './model/content-tree.store';

export { compareContent } from './api/compare.api';
export type { CompareResult } from './api/compare.api';
export {
    activateFilter,
    clearChildrenIdsRetryCooldown,
    clearFilterChildrenIdsRetryCooldown,
    clearVisibleContentDataRetryCooldown,
    clearVisibleFilterContentDataRetryCooldown,
    deactivateFilter,
    fetchChildrenIdsOnly,
    fetchContentByIds,
    fetchFilterChildrenIdsOnly,
    fetchMoreFilteredResults,
    fetchRootChildrenIdsOnly,
    fetchVisibleContentData,
    fetchVisibleFilterContentData,
    getFilterQuery,
    isChildrenIdsLoadFailed,
    isFilterChildrenIdsLoadFailed,
    isVisibleContentDataLoadFailed,
    isVisibleFilterContentDataLoadFailed,
    reloadContentTree,
    reloadParentChildren,
} from './api/content-fetcher';
export { fetchContentById, fetchContentByPath, fetchNearestSite } from './api/content.api';
export { fetchContentAttachments } from './api/attachments.api';
export { fetchEffectivePermissions } from './api/effectivePermissions.api';
export { resolveDependencies } from './api/dependencies.api';
export { hasUnpublishedChildren } from './api/hasUnpublishedChildren.api';
export { fetchVersion, revert } from './api/versions.api';
export { fetchContentSummaries } from './lib/contentSummaries';
export { formatCompareResult } from './lib/formatCompareResult';
export { useItemsWithUnpublishedChildren } from './lib/useItemsWithUnpublishedChildren';
export { $activeFlatNodes, $activeRawFlatNodes } from './model/active-tree.store';
export {
    $currentIds,
    $currentItem,
    $currentItems,
    $isAllLoadedSelected,
    $isNoneSelected,
    $selectionCount,
    clearSelection,
    getCurrentItems,
    getCurrentItemsAsCSCS,
    hasCurrentItems,
    selectAll,
    setActive,
    setSelection,
} from './model/content-selection.store';
export {
    $rootLoadingState,
    collapseNode,
    expandNode,
    hasTreeNode,
    isNodeExpanded,
    nodeNeedsChildrenLoad,
    removeTreeNode,
    resetTree,
} from './model/content-tree.store';
export { clearProjectContentCache, removeContent, setContent, setContents } from './model/content.commands';
export { revealContentByPath } from './model/content-reveal.service';
export type { RevealContentByPathOptions } from './model/content-reveal.service';
export { $revealScrollTarget, clearRevealScroll } from './model/content-reveal.store';
export { $contentCache, getContent, getContentAsCSCS, getIdByPath, getMissingIds } from './model/content.store';
export {
    start as startContentService,
    stop as stopContentService,
    isRunning as isContentServiceRunning,
} from './model/content.service';
export {
    $filterLoadingState,
    clearFilterRefreshNeeded,
    collapseFilterNode,
    expandFilterNode,
    filterNodeNeedsChildrenLoad,
    filterRootHasMoreChildren,
} from './model/filter-tree.store';

//
// * Read-only views
//
// Atoms stay private to the slice; writes go through commands.
//

export const $activeId = computed($_activeIdAtom, (value) => value);
export const $filterRefreshNeeded = computed($_filterRefreshNeededAtom, (value) => value);
export const $isFilterActive = computed($_isFilterActiveAtom, (value) => value);
export const $isReloading = computed($_isReloadingAtom, (value) => value);
export const $selection = computed($_selectionAtom, (value) => value);
export const $treeState = computed($_treeStateAtom, (value) => value);
