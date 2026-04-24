import type {FormOptionSet} from '@enonic/lib-admin-ui/form/set/optionset/FormOptionSet';

export function isLockedSingleOccurrence(optionSet: FormOptionSet): boolean {
    const occurrences = optionSet.getOccurrences();
    return occurrences.getMinimum() === 1 && occurrences.getMaximum() === 1;
}
