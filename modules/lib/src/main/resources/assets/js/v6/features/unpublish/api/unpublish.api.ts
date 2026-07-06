import { ResultAsync } from 'neverthrow';
import { TaskId } from '@enonic/lib-admin-ui/task/TaskId';
import { type TaskIdJson } from '@enonic/lib-admin-ui/task/TaskIdJson';
import { ContentId } from '../../../../app/content/ContentId';
import { type ContentIdBaseItemJson } from '../../../../app/resource/json/ContentIdBaseItemJson';
import { type InboundDependenciesJson } from '../../../../app/resource/json/InboundDependenciesJson';
import { requestJson } from '../../../shared/api/client';
import { AppError } from '../../../shared/api/errors';
import { getCmsApiUrl } from '../../../shared/lib/url/cms';

type ContentWithRefsResultJson = {
    contentIds: ContentIdBaseItemJson[];
    inboundDependencies: InboundDependenciesJson[];
};

export type ResolveUnpublishResult = {
    contentIds: ContentId[];
    inboundDependencies: {
        id: ContentId;
        inboundDependencies: ContentId[];
    }[];
};

/**
 * Resolve content IDs and inbound dependencies affected by unpublishing.
 * Used by: features/unpublish/model/unpublishDialog.service.
 */
export function resolveUnpublish(contentIds: ContentId[]): ResultAsync<ResolveUnpublishResult, AppError> {
    const url = getCmsApiUrl('resolveForUnpublish');

    const payload = {
        contentIds: contentIds.map((id) => id.toString()),
    };

    return requestJson<ContentWithRefsResultJson>(url, { method: 'POST', body: payload }).map((json) => ({
        contentIds: json.contentIds?.map((item) => new ContentId(item.id)) ?? [],
        inboundDependencies:
            json.inboundDependencies?.map((dep) => ({
                id: new ContentId(dep.id.id),
                inboundDependencies: dep.inboundDependencies?.map((item) => new ContentId(item.id)) ?? [],
            })) ?? [],
    }));
}

export type UnpublishOptions = {
    contentIds: ContentId[];
    includeChildren?: boolean;
};

/**
 * Unpublish content items.
 * Returns a TaskId that can be tracked for progress.
 * Used by: features/unpublish/model/unpublishDialog.store.
 */
export function unpublishContent(options: UnpublishOptions): ResultAsync<TaskId, AppError> {
    const url = getCmsApiUrl('unpublish');

    const payload = {
        ids: options.contentIds.map((id) => id.toString()),
        includeChildren: options.includeChildren ?? true,
    };

    return requestJson<TaskIdJson>(url, { method: 'POST', body: payload }).map(TaskId.fromJson);
}
