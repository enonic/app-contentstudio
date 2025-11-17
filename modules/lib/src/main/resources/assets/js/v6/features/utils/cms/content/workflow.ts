import type {ContentSummary} from '../../../../../app/content/ContentSummary';
import {WorkflowStateStatus} from '../../../../../app/wizard/WorkflowStateManager';

export function calcWorkflowStateStatus(summary: ContentSummary | null | undefined): WorkflowStateStatus | null {
    if (!summary) {
        return null;
    }
    if (!summary.isValid()) {
        return WorkflowStateStatus.INVALID;
    }
    if (summary.isReady()) {
        return WorkflowStateStatus.READY;
    }
    if (summary.isInProgress()) {
        return WorkflowStateStatus.IN_PROGRESS;
    }
    return null;
}
