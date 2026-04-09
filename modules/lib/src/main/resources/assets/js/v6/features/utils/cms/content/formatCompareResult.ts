import type {CompareResult} from '../../../api/compare';

export function formatCompareResult(
    result: CompareResult,
    movedLabel: string,
    modifiedLabel: string,
): string | undefined {
    if (result.diff.length === 0) return undefined;

    const isMoved = result.diff.includes('path');
    const isModified = result.diff.some(field => field !== 'path');

    if (isMoved && isModified) {
        return `${movedLabel}, ${modifiedLabel}`;
    }
    if (isMoved) {
        return movedLabel;
    }
    if (isModified) {
        return modifiedLabel;
    }
    return undefined;
}
