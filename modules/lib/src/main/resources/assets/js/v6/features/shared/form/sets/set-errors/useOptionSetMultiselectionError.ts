import {type FormOptionSet} from '@enonic/lib-admin-ui/form/set/optionset/FormOptionSet';
import {useI18n} from '@enonic/lib-admin-ui/form2';
import {useMemo} from 'react';

/**
 * Returns a localized min/max multi-selection error for an option-set
 * occurrence, gated on `showErrors` so it stays silent until the user has
 * interacted (or the form visibility is `'all'`).
 */
export function useOptionSetMultiselectionError(
    optionSet: FormOptionSet,
    showErrors: boolean,
    selectedNames: string[]
): string | undefined {
    const t = useI18n();
    const multiselection = optionSet.getMultiselection();

    return useMemo(() => {
        if (!showErrors) return undefined;
        const count = selectedNames.length;
        const min = multiselection.getMinimum();
        const max = multiselection.getMaximum();

        if (multiselection.minimumBreached(count)) {
            return min === 1 ? t('field.optionset.breaks.min.one') : t('field.optionset.breaks.min.many', min);
        }
        if (multiselection.maximumBreached(count)) {
            return max === 1 ? t('field.optionset.breaks.max.one') : t('field.optionset.breaks.max.many', max);
        }
        return undefined;
    }, [showErrors, selectedNames, multiselection, t]);
}
