import type {ContentSummary} from '../../../../../app/content/ContentSummary';
import type {ContentState} from '../../../../../app/content/ContentState';

export function calcContentState(summary: ContentSummary | null | undefined): ContentState | null {
    if (!summary) {
        return null;
    }
    if (!summary.isValid()) {
        return 'invalid';
    }
    if (summary.isReady()) {
        return 'ready';
    }
    if (summary.isInProgress()) {
        return 'in-progress';
    }
    return null;
}
