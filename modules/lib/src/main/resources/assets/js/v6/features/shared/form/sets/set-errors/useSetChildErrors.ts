import type {PropertySet} from '@enonic/lib-admin-ui/data/PropertySet';
import type {FormItem} from '@enonic/lib-admin-ui/form/FormItem';
import type {FormOptionSet} from '@enonic/lib-admin-ui/form/set/optionset/FormOptionSet';
import {validateFormItemsValid} from '@enonic/lib-admin-ui/form2';
import {useCallback, useEffect, useMemo, useState} from 'react';

const EMPTY = new Map<number, boolean>();
const SELECTED_NAME = '_selected';

/**
 * Per-occurrence validity flag for item sets. Recomputes when any occurrence
 * property changes; used to badge collapsed occurrences that contain errors.
 */
export function useItemSetChildErrors(formItems: FormItem[], propertySets: PropertySet[]): Map<number, boolean> {
    const tick = useOccurrenceChangeTick(propertySets);

    return useMemo(() => {
        if (propertySets.length === 0) return EMPTY;
        const next = new Map<number, boolean>();
        propertySets.forEach((ps, i) => {
            next.set(i, !validateFormItemsValid(formItems, ps));
        });
        return next;
    }, [formItems, propertySets, tick]);
}

/**
 * Per-occurrence validity flag for option sets. Covers multi-selection min/max
 * breaches in addition to form-item validity of the selected options' data.
 */
export function useOptionSetChildErrors(optionSet: FormOptionSet, propertySets: PropertySet[]): Map<number, boolean> {
    const tick = useOccurrenceChangeTick(propertySets);

    return useMemo(() => {
        if (propertySets.length === 0) return EMPTY;
        const next = new Map<number, boolean>();
        propertySets.forEach((ps, i) => {
            next.set(i, hasOptionSetOccurrenceError(optionSet, ps));
        });
        return next;
    }, [optionSet, propertySets, tick]);
}

function useOccurrenceChangeTick(propertySets: PropertySet[]): number {
    const [tick, setTick] = useState(0);
    const bump = useCallback(() => setTick((t) => t + 1), []);

    useEffect(() => {
        if (propertySets.length === 0) {
            return undefined;
        }

        for (const ps of propertySets) {
            ps.onChanged(bump);
        }

        return () => {
            for (const ps of propertySets) {
                ps.unChanged(bump);
            }
        };
    }, [bump, propertySets]);

    return tick;
}

function hasOptionSetOccurrenceError(optionSet: FormOptionSet, occurrencePS: PropertySet): boolean {
    const multiselection = optionSet.getMultiselection();
    const schemaOptionNames = optionSet.getOptions().map((o) => o.getName());

    const selectedArray = occurrencePS.getPropertyArray(SELECTED_NAME);
    const selectedNames =
        selectedArray
            ?.getProperties()
            .map((p) => p.getValue().getString())
            .filter((n): n is string => n != null && schemaOptionNames.includes(n)) ?? [];

    if (multiselection.minimumBreached(selectedNames.length)) return true;
    if (multiselection.maximumBreached(selectedNames.length)) return true;

    for (const selectedName of selectedNames) {
        const option = optionSet.getOptions().find((o) => o.getName() === selectedName);
        if (option == null || option.getFormItems().length === 0) continue;

        const optionDataSet = occurrencePS.getPropertyArray(selectedName)?.getSet(0);
        if (optionDataSet == null) return true;

        if (!validateFormItemsValid(option.getFormItems(), optionDataSet)) return true;
    }

    return false;
}
