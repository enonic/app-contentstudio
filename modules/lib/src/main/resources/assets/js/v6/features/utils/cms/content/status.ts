import type {ContentSummary} from '../../../../../app/content/ContentSummary';
import {PublishStatus} from '../../../../../app/publish/PublishStatus';
import type {ContentState} from '../../../../../app/content/ContentState';

export type SecondaryStatus = 'modified' | 'new' | 'unpublished';

export function createPublishStatusKey(status: PublishStatus): string {
    switch (status) {
        case PublishStatus.ONLINE:
            return 'status.online';
        case PublishStatus.PENDING:
            return 'status.scheduled';
        case PublishStatus.EXPIRED:
            return 'status.expired';
        case PublishStatus.OFFLINE:
            return 'status.offline';
        default:
            return 'status.offline';
    }
}

export function createSecondaryStatusKey(status: SecondaryStatus): string {
    switch (status) {
        case 'modified':
            return 'status.modified';
        case 'new':
            return 'status.new';
        case 'unpublished':
            return 'status.unpublished';
    }
}

export function calcTreePublishStatus(summary: ContentSummary): PublishStatus {
    const from = summary.getPublishFromTime();
    if (!from) return PublishStatus.OFFLINE;
    const now = Date.now();
    if (from.getTime() > now) return PublishStatus.PENDING;
    const to = summary.getPublishToTime();
    if (to && to.getTime() < now) return PublishStatus.EXPIRED;
    return PublishStatus.ONLINE;
}

export function calcSecondaryStatus(publishStatus: PublishStatus, summary: ContentSummary): SecondaryStatus | undefined {
    if (publishStatus === PublishStatus.OFFLINE) {
        return summary.getPublishFirstTime() ? 'unpublished' : 'new';
    }

    if (!summary.getPublishTime()) {
        return 'modified';
    }

    return undefined;
}

export function createContentStateKey(contentState: ContentState): string {
    switch (contentState) {
        case 'ready':
            return 'field.workflow.status.ready';
        case 'in-progress':
            return 'field.workflow.status.inProgress';
        case 'invalid':
            return 'field.invalid';
        default:
            return 'status.unknown';
    }
}
