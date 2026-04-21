import type {PropertySet} from '@enonic/lib-admin-ui/data/PropertySet';
import type {FormOptionSet} from '@enonic/lib-admin-ui/form/set/optionset/FormOptionSet';
import {selectOptionInPropertySet} from './useOptionSetSelection';

/**
 * Seeds a freshly created option-set occurrence with its configured default
 * selection(s). No-op when `_selected` already exists — presence (even empty)
 * means the user has touched the selection and their choice must be preserved.
 * Radio occurrences take only the first default; multi takes all.
 */
export function seedOptionSetDefaults(optionSet: FormOptionSet, occurrencePropertySet: PropertySet): void {
    if (occurrencePropertySet.getPropertyArray('_selected') != null) return;

    const opts = optionSet.getOptions();
    if (opts.length === 0) return;

    const defaults = opts.filter((o) => o.isDefaultOption());

    if (optionSet.isRadioSelection()) {
        if (defaults[0] != null) {
            selectOptionInPropertySet(occurrencePropertySet, optionSet, defaults[0].getName());
        }
        return;
    }

    for (const opt of defaults) {
        selectOptionInPropertySet(occurrencePropertySet, optionSet, opt.getName());
    }
}
