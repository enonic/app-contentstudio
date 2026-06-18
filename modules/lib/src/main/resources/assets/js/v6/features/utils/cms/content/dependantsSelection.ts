import {type ContentId} from '../../../../../app/content/ContentId';
import {hasContentIdInIds, uniqueIds} from './ids';

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
    const selectableIds = shownIds.filter(id => !hasContentIdInIds(id, requiredIds));
    const selectedCount = shownIds.filter(id => !hasContentIdInIds(id, excludedIds)).length;

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
        : currentExcludedIds.filter(id => !hasContentIdInIds(id, selection.selectableIds));
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
