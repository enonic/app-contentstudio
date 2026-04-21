import {type SetOccurrenceManagerState, useI18n} from '@enonic/lib-admin-ui/form2';
import {type Occurrences} from '@enonic/lib-admin-ui/form/Occurrences';
import {useMemo} from 'react';

/**
 * Returns a localized min/max occurrence-count error for a set, or `undefined`
 * if the count is within bounds. Centralizes the phrase selection (singular vs
 * plural, required vs min-breach) so `ItemSetView` and `OptionSetView` stay
 * consistent.
 */
export const useOccurrenceError = (occurrences: Occurrences, state: SetOccurrenceManagerState): string | undefined => {
    const t = useI18n();

    return useMemo(() => {
        const min = occurrences.getMinimum();
        const max = occurrences.getMaximum();

        if (state.isMinimumBreached) {
            return min === 1 ? t('field.value.required') : t('field.occurrence.breaks.min', min);
        }
        if (state.isMaximumBreached) {
            return max === 1 ? t('field.occurrence.breaks.max.one') : t('field.occurrence.breaks.max.many', max);
        }
        return undefined;
    }, [state.isMinimumBreached, state.isMaximumBreached, occurrences, t]);
};
