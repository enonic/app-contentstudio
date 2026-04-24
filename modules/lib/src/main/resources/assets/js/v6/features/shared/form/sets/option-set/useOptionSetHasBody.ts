import type {PropertySet} from '@enonic/lib-admin-ui/data/PropertySet';
import type {FormOptionSet} from '@enonic/lib-admin-ui/form/set/optionset/FormOptionSet';
import {useMemo} from 'react';
import {isLockedSingleOccurrence} from './isLockedSingleOccurrence';
import {useOptionSetSelection} from './useOptionSetSelection';

/**
 * Whether an option-set occurrence renders any body content.
 *
 * - Multi/checkbox: always true (checkbox list is always shown).
 * - Radio locked-single: always true (radio list is always shown).
 * - Radio with no selection: true (radio-group picker is shown).
 * - Radio with a selection: true only if the selected option has nested form items.
 */
export function useOptionSetHasBody(optionSet: FormOptionSet, propertySet: PropertySet): boolean {
    const {selectedNames} = useOptionSetSelection(optionSet, propertySet);

    return useMemo(() => {
        if (!optionSet.isRadioSelection()) return true;
        if (isLockedSingleOccurrence(optionSet)) return true;
        if (selectedNames.length === 0) return true;
        return optionSet.getOptions().some((o) => selectedNames.includes(o.getName()) && o.getFormItems().length > 0);
    }, [optionSet, selectedNames]);
}
