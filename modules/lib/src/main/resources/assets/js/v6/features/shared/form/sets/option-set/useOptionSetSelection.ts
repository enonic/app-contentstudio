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

    return created;
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

function writeRadioSelection(selectedArray: PropertyArray, name: string): void {
    const value = new Value(name, ValueTypes.STRING);
    const existing = selectedArray.get(0);
    if (existing != null) {
        existing.setValue(value);
    } else {
        selectedArray.add(value);
    }
}

/**
 * Appends `name` to the selected array and moves it into its alphabetical slot
 * so the backing order stays deterministic. Cheaper than rewriting the whole
 * array because it fires at most one add + one move instead of 2N events.
 */
function insertMultiSelection(selectedArray: PropertyArray, name: string, current: string[]): void {
    if (current.includes(name)) return;

    const nextSorted = [...current, name].sort();
    const targetIndex = nextSorted.indexOf(name);

    selectedArray.add(new Value(name, ValueTypes.STRING));
    const appendedIndex = selectedArray.getSize() - 1;
    if (appendedIndex !== targetIndex) {
        selectedArray.move(appendedIndex, targetIndex);
    }
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

    const ensureOption = useCallback(
        (name: string) => ensureOptionDataSet(occurrencePropertySet, name),
        [occurrencePropertySet]
    );

    const select = useCallback(
        (name: string) => {
            ensureOption(name);

            if (isRadio) {
                writeRadioSelection(selectedArray, name);
            } else {
                insertMultiSelection(selectedArray, name, selectedNames);
            }
        },
        [isRadio, selectedArray, selectedNames, ensureOption]
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

    if (optionSet.isRadioSelection()) {
        writeRadioSelection(selectedArray, name);
        return;
    }

    const schemaOptionNames = optionSet.getOptions().map((o) => o.getName());
    const current = readSelectedNames(selectedArray, schemaOptionNames);
    insertMultiSelection(selectedArray, name, current);
}
