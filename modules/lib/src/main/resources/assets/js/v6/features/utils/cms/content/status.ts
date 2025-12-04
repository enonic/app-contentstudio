import {CompareStatus} from '../../../../../app/content/CompareStatus';
import {PublishStatus} from '../../../../../app/publish/PublishStatus';
import {WorkflowStateStatus} from '../../../../../app/wizard/WorkflowStateManager';

export function createPublishStatusKey(status: PublishStatus): string {
    switch (status) {
        case PublishStatus.ONLINE:
            return 'status.online';
        case PublishStatus.PENDING:
            return 'status.scheduled';
        case PublishStatus.EXPIRED:
            return 'status.expired';
        default:
            return 'status.offline';
    }
}

export function createCompareStatusKey(status: CompareStatus, wasPublished: boolean): string {
    switch (status) {
        case CompareStatus.NEW:
            return wasPublished ? 'status.unpublished' : 'status.new';
        case CompareStatus.NEWER:
            return 'status.modified';
        case CompareStatus.OLDER:
            return 'status.outofdate';
        case CompareStatus.EQUAL:
            return 'status.published';
        case CompareStatus.MOVED:
            return 'status.moved';
        case CompareStatus.ARCHIVED:
            return 'status.archived';
        default:
            return 'status.unknown';
    }
}

export function createWorkflowStatusKey(workflowStatus: WorkflowStateStatus): string {
    switch (workflowStatus) {
        case WorkflowStateStatus.READY:
            return 'field.workflow.status.ready';
        case WorkflowStateStatus.IN_PROGRESS:
            return 'field.workflow.status.inProgress';
        case WorkflowStateStatus.INVALID:
            return 'field.workflow.status.invalid';
        default:
            return 'status.unknown';
    }
}
