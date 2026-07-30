import { type ContentId } from '../../../../../app/content/ContentId';
import { hasContentIdInIds, isIdsEqual } from './ids';

/**
 * The draft/applied selection pair shared by the dialogs that stage item selection edits behind
 * an Apply banner. The `applied*` fields are the last committed selection; the unprefixed ones
 * are what the user currently sees.
 */
export type DraftSelectionState = {
    excludeChildrenIds: ContentId[];
    excludedDependantIds: ContentId[];
    appliedExcludeChildrenIds: ContentId[];
    appliedExcludedDependantIds: ContentId[];
};

export type AppliedSelection = Pick<DraftSelectionState, 'appliedExcludeChildrenIds' | 'appliedExcludedDependantIds'>;

export type DraftSelection = Pick<DraftSelectionState, 'excludeChildrenIds' | 'excludedDependantIds'>;

/** True when no selection edit is staged, i.e. the Apply banner should stay hidden. */
export const isDraftSelectionSynced = (state: DraftSelectionState): boolean => {
    return (
        isIdsEqual(state.excludeChildrenIds, state.appliedExcludeChildrenIds) &&
        isIdsEqual(state.excludedDependantIds, state.appliedExcludedDependantIds)
    );
};

/** The applied fields advanced to the draft. Spread into the store on Apply. */
export const commitDraftSelection = (state: DraftSelectionState): AppliedSelection => {
    return {
        appliedExcludeChildrenIds: state.excludeChildrenIds,
        appliedExcludedDependantIds: state.excludedDependantIds,
    };
};

/** The draft fields reverted to the applied selection. Spread into the store on Cancel. */
export const revertDraftSelection = (state: DraftSelectionState): DraftSelection => {
    return {
        excludeChildrenIds: state.appliedExcludeChildrenIds,
        excludedDependantIds: state.appliedExcludedDependantIds,
    };
};

/**
 * Add or remove an id from an exclusion list.
 *
 * Returns the same array reference when the id is already in the requested state, so callers can
 * skip the write and avoid waking store subscribers on a no-op toggle.
 */
export const withIdExcluded = (ids: ContentId[], id: ContentId, excluded: boolean): ContentId[] => {
    const isExcluded = hasContentIdInIds(id, ids);

    if (excluded === isExcluded) {
        return ids;
    }

    return excluded ? [...ids, id] : ids.filter((item) => !item.equals(id));
};
