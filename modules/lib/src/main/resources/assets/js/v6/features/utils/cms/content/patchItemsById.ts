type IdAwareItem = {
    getId: () => string;
};

export function patchItemsById<T extends IdAwareItem>(
    items: T[],
    updates: readonly T[],
): {items: T[]; changed: boolean} {
    if (items.length === 0 || updates.length === 0) {
        return {items, changed: false};
    }

    const updateMap = new Map(updates.map(item => [item.getId(), item]));
    let changed = false;

    const patchedItems = items.map(item => {
        const updatedItem = updateMap.get(item.getId());
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
