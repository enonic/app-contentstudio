import { ResultAsync, errAsync, okAsync } from 'neverthrow';
import { TaskId } from '@enonic/lib-admin-ui/task/TaskId';
import { type TaskIdJson } from '@enonic/lib-admin-ui/task/TaskIdJson';
import { ContentId } from '../../../../app/content/ContentId';
import { type ContentIdBaseItemJson } from '../../../../app/resource/json/ContentIdBaseItemJson';
import { type ResolvePublishContentResultJson } from '../../../../app/resource/json/ResolvePublishContentResultJson';
import { ResolvePublishDependenciesResult } from '../../../../app/resource/ResolvePublishDependenciesResult';
import { requestJson, requestOptionalJson } from '../../../shared/api/client';
import { AppError } from '../../../shared/api/errors';
import { getCmsApiUrl } from '../../../shared/lib/url/cms';

export type PublishContentParams = {
    /**
     * Root IDs selected in the publish dialog (main list only).
     * Dependants are resolved and included server-side.
     */
    ids: ContentId[];
    /**
     * IDs explicitly excluded from the resolved dependant list.
     */
    excludedIds?: ContentId[];
    /**
     * Root IDs whose descendants should be excluded.
     * This is typically all selected roots until "include children" is enabled per item.
     */
    excludeChildrenIds?: ContentId[];
    message?: string;
    schedule?: {
        from?: Date;
        to?: Date;
    };
};

export type ResolvePublishParams = {
    /**
     * Root IDs selected in the publish dialog (main list only).
     */
    ids: ContentId[];
    /**
     * IDs explicitly excluded from the resolved dependant list.
     */
    excludedIds?: ContentId[];
    /**
     * Root IDs whose descendants should be excluded.
     */
    excludeChildrenIds?: ContentId[];
};

/**
 * Find all child content IDs for given parent content IDs.
 * Used by: features/publish/model/publishDialog.commands.
 */
export function findIdsByParents(contentIds: ContentId[]): ResultAsync<ContentId[], AppError> {
    if (contentIds.length === 0) {
        return okAsync([]);
    }

    const url = getCmsApiUrl('findIdsByParents');

    const payload = {
        contentIds: contentIds.map((id) => id.toString()),
    };

    return requestJson<{ ids: ContentIdBaseItemJson[] }>(url, { method: 'POST', body: payload }).map(
        (json) => json.ids?.map((item) => new ContentId(item.id)) ?? [],
    );
}

/**
 * Mark content items as ready for publishing.
 * Used by: features/publish/model/publishDialog.commands,
 * features/request-publish/model/requestPublishDialog.store.
 */
export function markAsReady(contentIds: ContentId[]): ResultAsync<void, AppError> {
    if (contentIds.length === 0) {
        return okAsync(undefined);
    }

    const url = getCmsApiUrl('markAsReady');

    const payload = {
        contentIds: contentIds.map((id) => id.toString()),
    };

    // The endpoint answer carries no data the caller needs, so tolerate an empty body.
    return requestOptionalJson(url, { method: 'POST', body: payload }).map(() => undefined);
}

/**
 * Publish content items.
 * Returns a TaskId that can be tracked for progress.
 * Used by: features/publish/model/publishDialog.commands.
 */
export function publishContent(params: PublishContentParams): ResultAsync<TaskId, AppError> {
    if (params.ids.length === 0) {
        return errAsync(new AppError('No content to publish'));
    }

    const url = getCmsApiUrl('publish');

    const schedule =
        params.schedule?.from || params.schedule?.to
            ? {
                  from: params.schedule.from?.toISOString() ?? new Date().toISOString(),
                  to: params.schedule.to?.toISOString() ?? null,
              }
            : null;

    const payload = {
        ids: params.ids.map((id) => id.toString()),
        excludedIds: params.excludedIds?.map((id) => id.toString()) ?? [],
        excludeChildrenIds: params.excludeChildrenIds?.map((id) => id.toString()) ?? [],
        schedule,
        message: params.message,
    };

    return requestJson<TaskIdJson>(url, { method: 'POST', body: payload }).map(TaskId.fromJson);
}

/**
 * Resolve publish dependencies for content items.
 * Returns dependants, required items, invalid items, and other publish-related info.
 * Used by: features/publish/model/publishDialog.commands,
 * features/issues/model/issueDialogDetails.store, features/issues/model/newIssueDialog.store,
 * features/request-publish/model/requestPublishDialog.store.
 */
export function resolvePublishDependencies(
    params: ResolvePublishParams,
): ResultAsync<ResolvePublishDependenciesResult, AppError> {
    const url = getCmsApiUrl('resolvePublishContent');

    const payload = {
        ids: params.ids.map((id) => id.toString()),
        excludedIds: params.excludedIds?.map((id) => id.toString()) ?? [],
        excludeChildrenIds: params.excludeChildrenIds?.map((id) => id.toString()) ?? [],
    };

    return requestJson<ResolvePublishContentResultJson>(url, { method: 'POST', body: payload }).map(
        ResolvePublishDependenciesResult.fromJson,
    );
}
