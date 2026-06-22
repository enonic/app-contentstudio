import type {PropertySet} from '@enonic/lib-admin-ui/data/PropertySet';
import {ValueTypes} from '@enonic/lib-admin-ui/data/ValueTypes';

const SELECTED_NAME = '_selected';

/**
 * Strips option-set data for options that are not selected, so deselected options
 * are not persisted. An occurrence is any `PropertySet` carrying a `_selected`
 * string array; its sibling option data arrays not listed there are removed.
 */
export function pruneUnselectedOptionData(set: PropertySet): void {
    const selected = readSelectedNames(set);

    for (const array of set.getPropertyArrays()) {
        if (!array.getType().equals(ValueTypes.DATA)) continue;

        const name = array.getName();
        if (selected != null && name !== SELECTED_NAME && !selected.has(name)) {
            set.removeProperty(name, 0);
            continue;
        }

        for (let i = 0; i < array.getSize(); i++) {
            const child = array.getSet(i);
            if (child != null) pruneUnselectedOptionData(child);
        }
    }
}

function readSelectedNames(set: PropertySet): Set<string> | null {
    const selectedArray = set.getPropertyArray(SELECTED_NAME);
    if (selectedArray == null || !selectedArray.getType().equals(ValueTypes.STRING)) return null;

    const names = new Set<string>();
    selectedArray.forEach((property) => {
        const name = property.getValue().getString();
        if (name != null) names.add(name);
    });

    return names;
}
