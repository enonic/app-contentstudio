import {hasOccurrenceError, useValidationVisibility} from '@enonic/lib-admin-ui/form2';
import {type Occurrences} from '@enonic/lib-admin-ui/form/Occurrences';
import {type OccurrenceValidationState} from '@enonic/lib-admin-ui/form2/descriptor';

export const useSelectorInputHasError = (occurrences: Occurrences, errors: OccurrenceValidationState[]): boolean => {
    const visibility = useValidationVisibility();

    if (visibility !== 'all') return false;

    const hasFieldError = errors.some((error) => error.breaksRequired || error.validationResults.length > 0);

    return hasFieldError || hasOccurrenceError(occurrences, errors);
};
