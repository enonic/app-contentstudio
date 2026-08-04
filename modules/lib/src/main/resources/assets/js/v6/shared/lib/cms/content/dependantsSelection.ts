import { type ContentId } from '../../../../../app/content/ContentId';
import { hasContentIdInIds, type HasContentId, uniqueIds } from './ids';

// Tri-state of a dependants list's batch "select all" checkbox (legacy `SelectionType`).
export type DependantsSelectionType = 'all' | 'none' | 'partial';

export type DependantsSelection = {
    count: number;
    selectionType: DependantsSelectionType;
    disabled: boolean;
    selectableIds: ContentId[];
};

/**
 * Derive the batch "select all" state for a dependants list.
 *
 * @param shownIds  every dependant currently shown in the list (full id set, not just loaded)
 * @param requiredIds  dependants that cannot be deselected
 * @param excludedIds  dependants the user has deselected
 *
 * When no dependant is excludable (all mandatory) the checkbox is `all` and disabled.
 */
export const calcDependantsSelection = (
    shownIds: readonly ContentId[],
    requiredIds: readonly ContentId[],
    excludedIds: readonly ContentId[],
): DependantsSelection => {
    const selectableIds = shownIds.filter((id) => !hasContentIdInIds(id, requiredIds));
    const selectedCount = shownIds.filter((id) => !hasContentIdInIds(id, excludedIds)).length;

    return {
        count: shownIds.length,
        selectionType: calcSelectionType(selectableIds.length, selectedCount, shownIds.length),
        disabled: selectableIds.length === 0,
        selectableIds,
    };
};

/**
 * Next exclusion set for a batch toggle: deselect every selectable dependant when all are
 * selected, otherwise select them all (clear their exclusions). Required dependants are never
 * touched because they are not part of `selection.selectableIds`.
 */
export const nextDependantExclusions = (
    selection: DependantsSelection,
    currentExcludedIds: readonly ContentId[],
): ContentId[] => {
    return selection.selectionType === 'all'
        ? uniqueIds([...currentExcludedIds, ...selection.selectableIds])
        : currentExcludedIds.filter((id) => !hasContentIdInIds(id, selection.selectableIds));
};

/**
 * Drop exclusions the server no longer honours: ids that left the dependant list, and ids that
 * became required (a required dependant cannot stay deselected).
 */
export const pruneExcludedDependantIds = (
    excludedIds: readonly ContentId[],
    shownIds: readonly ContentId[],
    requiredIds: readonly ContentId[],
): ContentId[] => {
    return excludedIds.filter((id) => hasContentIdInIds(id, shownIds) && !hasContentIdInIds(id, requiredIds));
};

/** True when at least one dependant is applied-excluded, so the toggle has something to hide. */
export const hasHideableExcludedDependants = (
    dependantIds: readonly ContentId[],
    appliedExcludedIds: readonly ContentId[],
): boolean => {
    return dependantIds.some((id) => hasContentIdInIds(id, appliedExcludedIds));
};

/**
 * The dependant ids left in the list while "Hide excluded" is active. Keyed on the applied
 * exclusions, never the draft: a staged exclusion must not hide a row while Apply is still up.
 */
export const filterShownDependantIds = (
    dependantIds: ContentId[],
    appliedExcludedIds: readonly ContentId[],
    showExcluded: boolean,
): ContentId[] => {
    if (showExcluded) return dependantIds;

    return dependantIds.filter((id) => !hasContentIdInIds(id, appliedExcludedIds));
};

/** {@link filterShownDependantIds} for the loaded summary window. */
export const filterShownDependants = <T extends HasContentId>(
    dependants: T[],
    appliedExcludedIds: readonly ContentId[],
    showExcluded: boolean,
): T[] => {
    if (showExcluded) return dependants;

    return dependants.filter((item) => !hasContentIdInIds(item.getContentId(), appliedExcludedIds));
};

const calcSelectionType = (
    selectableCount: number,
    selectedCount: number,
    shownCount: number,
): DependantsSelectionType => {
    if (selectableCount === 0 || selectedCount === shownCount) {
        return 'all';
    }
    if (selectedCount === 0) {
        return 'none';
    }
    return 'partial';
};
