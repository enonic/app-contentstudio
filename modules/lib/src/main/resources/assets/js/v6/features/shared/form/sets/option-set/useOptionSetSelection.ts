import {PropertyArray} from '@enonic/lib-admin-ui/data/PropertyArray';
import type {PropertySet} from '@enonic/lib-admin-ui/data/PropertySet';
import {Value} from '@enonic/lib-admin-ui/data/Value';
import {ValueTypes} from '@enonic/lib-admin-ui/data/ValueTypes';
import type {FormOptionSet} from '@enonic/lib-admin-ui/form/set/optionset/FormOptionSet';
import {usePropertyArray} from '@enonic/lib-admin-ui/form2';
import {useCallback, useMemo} from 'react';

const SELECTED_NAME = '_selected';

function ensureSelectedArray(occurrencePropertySet: PropertySet): PropertyArray {
    const existing = occurrencePropertySet.getPropertyArray(SELECTED_NAME);
    if (existing != null) return existing;

    const created = PropertyArray.create()
        .setName(SELECTED_NAME)
        .setType(ValueTypes.STRING)
        .setParent(occurrencePropertySet)
        .build();
    occurrencePropertySet.addPropertyArray(created);

    return occurrencePropertySet.getPropertyArray(SELECTED_NAME) ?? created;
}

type UseOptionSetSelectionResult = {
    selectedNames: string[];
    isSelected: (name: string) => boolean;
    select: (name: string) => void;
    deselect: (name: string) => void;
    toggle: (name: string) => void;
};

/**
 * Reads and mutates the `_selected` array on an option-set occurrence. Exists
 * because option sets encode selection as a sibling string array rather than a
 * boolean per option; this hook centralizes the radio vs multi rules and keeps
 * ordering deterministic (alphabetic for multi).
 */
export function useOptionSetSelection(optionSet: FormOptionSet, occurrencePropertySet: PropertySet): UseOptionSetSelectionResult {
    const isRadio = optionSet.isRadioSelection();
    const schemaOptionNames = useMemo(() => optionSet.getOptions().map((o) => o.getName()), [optionSet]);

    const selectedArray = useMemo(() => ensureSelectedArray(occurrencePropertySet), [occurrencePropertySet]);

    const {values} = usePropertyArray(selectedArray);

    const selectedNames = useMemo(() => {
        return values.map((v) => v.getString()).filter((n): n is string => n != null && schemaOptionNames.includes(n));
    }, [values, schemaOptionNames]);

    const isSelected = useCallback((name: string) => selectedNames.includes(name), [selectedNames]);

    const ensureOptionPropertySet = useCallback(
        (name: string) => {
            let optionArray = occurrencePropertySet.getPropertyArray(name);
            if (optionArray == null) {
                optionArray = PropertyArray.create().setName(name).setType(ValueTypes.DATA).setParent(occurrencePropertySet).build();
                occurrencePropertySet.addPropertyArray(optionArray);
            }
            if (optionArray.getSize() === 0) {
                optionArray.addSet();
            }
        },
        [occurrencePropertySet]
    );

    const select = useCallback(
        (name: string) => {
            ensureOptionPropertySet(name);

            if (isRadio) {
                const value = new Value(name, ValueTypes.STRING);
                const existing = selectedArray.get(0);
                if (existing != null) {
                    existing.setValue(value);
                } else {
                    selectedArray.add(value);
                }
            } else {
                const alreadySelected = selectedNames.includes(name);
                if (!alreadySelected) {
                    const allNames = [...selectedNames, name].sort();
                    while (selectedArray.getSize() > 0) {
                        selectedArray.remove(selectedArray.getSize() - 1);
                    }
                    for (const n of allNames) {
                        selectedArray.add(new Value(n, ValueTypes.STRING));
                    }
                }
            }
        },
        [isRadio, selectedArray, selectedNames, ensureOptionPropertySet]
    );

    const deselect = useCallback(
        (name: string) => {
            const size = selectedArray.getSize();
            for (let i = 0; i < size; i++) {
                if (selectedArray.get(i)?.getValue().getString() === name) {
                    selectedArray.remove(i);
                    break;
                }
            }
        },
        [selectedArray]
    );

    const toggle = useCallback(
        (name: string) => {
            if (selectedNames.includes(name)) {
                deselect(name);
            } else {
                select(name);
            }
        },
        [selectedNames, select, deselect]
    );

    return {selectedNames, isSelected, select, deselect, toggle};
}

export function selectOptionInPropertySet(occurrencePropertySet: PropertySet, optionSet: FormOptionSet, name: string): void {
    ensureOptionDataSet(occurrencePropertySet, name);

    const selectedArray = ensureSelectedArray(occurrencePropertySet);
    const isRadio = optionSet.isRadioSelection();

    if (isRadio) {
        const value = new Value(name, ValueTypes.STRING);
        const existing = selectedArray.get(0);
        if (existing != null) {
            existing.setValue(value);
        } else {
            selectedArray.add(value);
        }
        return;
    }

    const schemaOptionNames = optionSet.getOptions().map((o) => o.getName());
    const current = readSelectedNames(selectedArray, schemaOptionNames);
    if (current.includes(name)) return;

    const allNames = [...current, name].sort();
    while (selectedArray.getSize() > 0) {
        selectedArray.remove(selectedArray.getSize() - 1);
    }
    for (const n of allNames) {
        selectedArray.add(new Value(n, ValueTypes.STRING));
    }
}

function ensureOptionDataSet(occurrencePropertySet: PropertySet, name: string): void {
    let optionArray = occurrencePropertySet.getPropertyArray(name);
    if (optionArray == null) {
        optionArray = PropertyArray.create().setName(name).setType(ValueTypes.DATA).setParent(occurrencePropertySet).build();
        occurrencePropertySet.addPropertyArray(optionArray);
    }
    if (optionArray.getSize() === 0) {
        optionArray.addSet();
    }
}

function readSelectedNames(selectedArray: PropertyArray, schemaOptionNames: string[]): string[] {
    const out: string[] = [];
    const size = selectedArray.getSize();
    for (let i = 0; i < size; i++) {
        const name = selectedArray.get(i)?.getValue().getString();
        if (name != null && schemaOptionNames.includes(name)) out.push(name);
    }
    return out;
}
