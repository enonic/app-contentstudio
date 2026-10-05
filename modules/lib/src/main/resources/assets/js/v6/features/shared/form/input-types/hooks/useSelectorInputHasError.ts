import { hasOccurrenceError, useValidationVisibility } from '@enonic/input-types';
import { type Occurrences } from '@enonic/input-types/schema';
import { type OccurrenceValidationState } from '@enonic/input-types';

export const useSelectorInputHasError = (occurrences: Occurrences, errors: OccurrenceValidationState[]): boolean => {
    const visibility = useValidationVisibility();

    if (visibility !== 'all') return false;

    const hasFieldError = errors.some((error) => error.breaksRequired || error.validationResults.length > 0);

    return hasFieldError || hasOccurrenceError(occurrences, errors);
};
