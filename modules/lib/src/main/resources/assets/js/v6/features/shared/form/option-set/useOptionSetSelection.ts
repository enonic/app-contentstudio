import {PropertyArray} from '@enonic/lib-admin-ui/data/PropertyArray';
import type {PropertySet} from '@enonic/lib-admin-ui/data/PropertySet';
import {Value} from '@enonic/lib-admin-ui/data/Value';
import {ValueTypes} from '@enonic/lib-admin-ui/data/ValueTypes';
import type {FormOptionSet} from '@enonic/lib-admin-ui/form/set/optionset/FormOptionSet';
import {usePropertyArray} from '@enonic/lib-admin-ui/form2';
import {useCallback, useMemo} from 'react';

const SELECTED_NAME = '_selected';

type UseOptionSetSelectionResult = {
    selectedNames: string[];
    isSelected: (name: string) => boolean;
    select: (name: string) => void;
    deselect: (name: string) => void;
    toggle: (name: string) => void;
};

export function useOptionSetSelection(
    optionSet: FormOptionSet,
    occurrencePropertySet: PropertySet,
): UseOptionSetSelectionResult {
    const isRadio = optionSet.isRadioSelection();
    const schemaOptionNames = useMemo(
        () => optionSet.getOptions().map(o => o.getName()),
        [optionSet],
    );

    const selectedArray = useMemo(() => {
        let array = occurrencePropertySet.getPropertyArray(SELECTED_NAME);

        if (array == null) {
            array = PropertyArray.create()
                .setName(SELECTED_NAME)
                .setType(ValueTypes.STRING)
                .setParent(occurrencePropertySet)
                .build();
            occurrencePropertySet.addPropertyArray(array);
        }

        return array;
    }, [occurrencePropertySet]);

    const {values} = usePropertyArray(selectedArray);

    const selectedNames = useMemo(() => {
        return values
            .map(v => v.getString())
            .filter((n): n is string => n != null && schemaOptionNames.includes(n));
    }, [values, schemaOptionNames]);

    const isSelected = useCallback(
        (name: string) => selectedNames.includes(name),
        [selectedNames],
    );

    const ensureOptionPropertySet = useCallback(
        (name: string) => {
            let optionArray = occurrencePropertySet.getPropertyArray(name);
            if (optionArray == null) {
                optionArray = PropertyArray.create()
                    .setName(name)
                    .setType(ValueTypes.DATA)
                    .setParent(occurrencePropertySet)
                    .build();
                occurrencePropertySet.addPropertyArray(optionArray);
            }
            if (optionArray.getSize() === 0) {
                optionArray.addSet();
            }
        },
        [occurrencePropertySet],
    );

    const select = useCallback(
        (name: string) => {
            ensureOptionPropertySet(name);

            if (isRadio) {
                // Radio: replace single selection
                const value = new Value(name, ValueTypes.STRING);
                const existing = selectedArray.get(0);
                if (existing != null) {
                    existing.setValue(value);
                } else {
                    selectedArray.add(value);
                }
            } else {
                // Multi: add and sort
                const alreadySelected = selectedNames.includes(name);
                if (!alreadySelected) {
                    selectedArray.add(new Value(name, ValueTypes.STRING));
                    // Sort alphabetically by rebuilding array
                    const allNames = [...selectedNames, name].sort();
                    // Remove all and re-add sorted
                    while (selectedArray.getSize() > 0) {
                        selectedArray.remove(selectedArray.getSize() - 1);
                    }
                    for (const n of allNames) {
                        selectedArray.add(new Value(n, ValueTypes.STRING));
                    }
                }
            }
        },
        [isRadio, selectedArray, selectedNames, ensureOptionPropertySet],
    );

    const deselect = useCallback(
        (name: string) => {
            // Find index in the raw array, not filtered selectedNames —
            // stale option names in _selected would shift filtered indices.
            const size = selectedArray.getSize();
            for (let i = 0; i < size; i++) {
                if (selectedArray.get(i)?.getValue().getString() === name) {
                    selectedArray.remove(i);
                    break;
                }
            }
        },
        [selectedArray],
    );

    const toggle = useCallback(
        (name: string) => {
            if (selectedNames.includes(name)) {
                deselect(name);
            } else {
                select(name);
            }
        },
        [selectedNames, select, deselect],
    );

    return {selectedNames, isSelected, select, deselect, toggle};
}
