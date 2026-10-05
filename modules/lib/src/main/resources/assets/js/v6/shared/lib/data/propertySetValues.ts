import { type PropertySet, ValueTypes } from '@enonic/input-types/data';

export type PropertySetValue = { name: string; value: string; path: string };

const SELECTED_NAME = '_selected';

/**
 * Every leaf value of a set as text with its data path, first occurrence only, through nested
 * sets; an option set's own `_selected` array is left out. What a display-name expression reads.
 */
export function getValuesAsString(set: PropertySet): PropertySetValue[] {
    const result: PropertySetValue[] = [];
    for (const array of set.getPropertyArrays()) {
        const name = array.getName();
        if (name === SELECTED_NAME) continue;
        if (array.getType().equals(ValueTypes.DATA)) {
            array.forEach((property) => {
                const child = property.getPropertySet();
                if (child != null) result.push(...getValuesAsString(child));
            });
        } else if (!array.isEmpty()) {
            const property = array.get(0);
            if (property == null) continue;
            const value = property.getValue();
            result.push({
                name,
                value: value.isNull() ? '' : (value.getString() ?? ''),
                path: property.getPath().toString().substring(1),
            });
        }
    }
    return result;
}
