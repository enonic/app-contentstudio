import {PropertyArray} from '@enonic/lib-admin-ui/data/PropertyArray';
import type {PropertySet} from '@enonic/lib-admin-ui/data/PropertySet';
import {ValueTypes} from '@enonic/lib-admin-ui/data/ValueTypes';
import type {Occurrences} from '@enonic/lib-admin-ui/form/Occurrences';
import {useEffect, useMemo} from 'react';

type UseSetPropertyArrayOptions = {
    onCreateOccurrence?: (occurrencePropertySet: PropertySet) => void;
};

/**
 * Lazily materializes the `PropertyArray` backing an item/option set and seeds
 * missing min-required occurrences in an effect. Seeding runs post-render
 * because `addSet()` fires tree events that must not happen during render.
 * `onCreateOccurrence` lets callers (e.g. option sets) initialize defaults on
 * each freshly seeded occurrence.
 */
export function useSetPropertyArray(
    name: string,
    propertySet: PropertySet,
    occurrences: Occurrences,
    options?: UseSetPropertyArrayOptions,
): PropertyArray {
    const propertyArray = useMemo(() => {
        let array = propertySet.getPropertyArray(name);

        if (array == null) {
            array = PropertyArray.create().setName(name).setType(ValueTypes.DATA).setParent(propertySet).build();
            propertySet.addPropertyArray(array);
        }

        return array;
    }, [name, propertySet]);

    const onCreateOccurrence = options?.onCreateOccurrence;

    useEffect(() => {
        const min = occurrences.getMinimum();

        while (propertyArray.getSize() < min) {
            const created = propertyArray.addSet();
            onCreateOccurrence?.(created);
        }
    }, [propertyArray, occurrences, onCreateOccurrence]);

    return propertyArray;
}
