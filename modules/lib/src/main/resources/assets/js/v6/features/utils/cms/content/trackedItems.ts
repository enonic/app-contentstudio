import type {ContentId} from '../../../../../app/content/ContentId';

// Array-level helpers support stores with split item/dependant atoms.
// State-level helpers support stores that keep both lists and exclusion IDs together.

type ContentIdValue = {
    toString: () => string;
};

export type TrackedContentItem = {
    getContentId: () => ContentIdValue;
};

export type TrackedContentItemsState<T extends TrackedContentItem> = {
    items: T[];
    dependants: T[];
    excludeChildrenIds: ContentId[];
    excludedDependantIds: ContentId[];
    requiredDependantIds: ContentId[];
};

type TrackedContentItemsChange<
    T extends TrackedContentItem,
    S extends TrackedContentItemsState<T>,
> = {
    state: S;
    changed: boolean;
    changedMain: boolean;
    changedDependants: boolean;
};

// Key by ContentId rather than getId() so change-event items and summaries use the same identity.
export function patchContentItemsByContentId<T extends TrackedContentItem>(
    items: T[],
    updates: readonly T[],
): {items: T[]; changed: boolean} {
    if (items.length === 0 || updates.length === 0) {
        return {items, changed: false};
    }

    const updateMap = new Map(updates.map(item => [item.getContentId().toString(), item]));
    let changed = false;

    const patchedItems = items.map(item => {
        const updatedItem = updateMap.get(item.getContentId().toString());
        if (updatedItem) {
            changed = true;
            return updatedItem;
        }

        return item;
    });

    return {
        items: changed ? patchedItems : items,
        changed,
    };
}

export function removeContentItemsById<T extends TrackedContentItem>(
    items: T[],
    idsToRemove: Set<string>,
): {items: T[]; changed: boolean} {
    if (items.length === 0 || idsToRemove.size === 0) {
        return {items, changed: false};
    }

    const nextItems = items.filter(item => !idsToRemove.has(item.getContentId().toString()));
    return {
        items: nextItems,
        changed: nextItems.length !== items.length,
    };
}

export function createContentIdSet(items: readonly TrackedContentItem[]): Set<string> {
    return new Set(items.map(item => item.getContentId().toString()));
}

export function patchTrackedContentItems<
    T extends TrackedContentItem,
    S extends TrackedContentItemsState<T>,
>(
    state: S,
    updates: readonly T[],
): TrackedContentItemsChange<T, S> {
    if (updates.length === 0) {
        return {
            state,
            changed: false,
            changedMain: false,
            changedDependants: false,
        };
    }

    const patchedItems = patchContentItemsByContentId(state.items, updates);
    const patchedDependants = patchContentItemsByContentId(state.dependants, updates);
    const changedMain = patchedItems.changed;
    const changedDependants = patchedDependants.changed;

    if (!changedMain && !changedDependants) {
        return {
            state,
            changed: false,
            changedMain,
            changedDependants,
        };
    }

    return {
        state: {
            ...state,
            items: patchedItems.items,
            dependants: patchedDependants.items,
        },
        changed: true,
        changedMain,
        changedDependants,
    };
}

export function removeTrackedContentItems<
    T extends TrackedContentItem,
    S extends TrackedContentItemsState<T>,
>(
    state: S,
    idsToRemove: Set<string>,
): TrackedContentItemsChange<T, S> {
    const removedItems = removeContentItemsById(state.items, idsToRemove);
    const removedDependants = removeContentItemsById(state.dependants, idsToRemove);
    const {items} = removedItems;
    const dependants = removedDependants.items;
    const excludeChildrenIds = state.excludeChildrenIds.filter(id => !idsToRemove.has(id.toString()));
    const excludedDependantIds = state.excludedDependantIds.filter(id => !idsToRemove.has(id.toString()));
    const requiredDependantIds = state.requiredDependantIds.filter(id => !idsToRemove.has(id.toString()));

    const changedMain = removedItems.changed;
    const changedDependants = removedDependants.changed;
    const exclusionsChanged = excludeChildrenIds.length !== state.excludeChildrenIds.length ||
        excludedDependantIds.length !== state.excludedDependantIds.length ||
        requiredDependantIds.length !== state.requiredDependantIds.length;

    if (!changedMain && !changedDependants && !exclusionsChanged) {
        return {
            state,
            changed: false,
            changedMain,
            changedDependants,
        };
    }

    return {
        state: {
            ...state,
            items,
            dependants,
            excludeChildrenIds,
            excludedDependantIds,
            requiredDependantIds,
        },
        changed: true,
        changedMain,
        changedDependants,
    };
}

export async function refreshTrackedMainContentItems<
    T extends TrackedContentItem,
    S extends TrackedContentItemsState<T>,
>(
    state: S,
    ids: ContentId[],
    fetchItems: (ids: ContentId[]) => Promise<T[]>,
): Promise<TrackedContentItemsChange<T, S>> {
    if (ids.length === 0) {
        return {
            state,
            changed: false,
            changedMain: false,
            changedDependants: false,
        };
    }

    const updatedItems = await fetchItems(ids);
    return patchTrackedContentItems(state, updatedItems);
}
