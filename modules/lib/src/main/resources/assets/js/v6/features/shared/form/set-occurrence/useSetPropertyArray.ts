import {PropertyArray} from '@enonic/lib-admin-ui/data/PropertyArray';
import type {PropertySet} from '@enonic/lib-admin-ui/data/PropertySet';
import {ValueTypes} from '@enonic/lib-admin-ui/data/ValueTypes';
import type {Occurrences} from '@enonic/lib-admin-ui/form/Occurrences';
import {useEffect, useMemo} from 'react';

export function useSetPropertyArray(
    name: string,
    propertySet: PropertySet,
    occurrences: Occurrences,
): PropertyArray {
    const propertyArray = useMemo(() => {
        let array = propertySet.getPropertyArray(name);

        if (array == null) {
            array = PropertyArray.create()
                .setName(name)
                .setType(ValueTypes.DATA)
                .setParent(propertySet)
                .build();
            propertySet.addPropertyArray(array);
        }

        return array;
    }, [name, propertySet, occurrences]);

    // Seed in effect to avoid side effects during render (addSet fires tree events).
    // Matches InputField's pattern where OccurrenceManager seeds in useEffect.
    useEffect(() => {
        const min = occurrences.getMinimum();
        while (propertyArray.getSize() < min) {
            propertyArray.addSet();
        }
    }, [propertyArray, occurrences]);

    return propertyArray;
}
