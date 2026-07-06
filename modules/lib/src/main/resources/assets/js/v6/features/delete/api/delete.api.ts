import { ResultAsync, errAsync } from 'neverthrow';
import { TaskId } from '@enonic/lib-admin-ui/task/TaskId';
import { type TaskIdJson } from '@enonic/lib-admin-ui/task/TaskIdJson';
import { type ContentId } from '../../../../app/content/ContentId';
import { type ContentPath } from '../../../../app/content/ContentPath';
import { ContentWithRefsResult } from '../../../../app/resource/ContentWithRefsResult';
import { type ContentWithRefsResultJson } from '../../../../app/resource/json/ContentWithRefsResultJson';
import { requestJson } from '../../../shared/api/client';
import { AppError } from '../../../shared/api/errors';
import { getCmsApiUrl } from '../../../shared/lib/url/cms';

/**
 * Archive content items.
 * Returns a TaskId that can be tracked for progress.
 * Used by: features/delete/model/deleteDialog.store.
 */
export function archiveContent(contentIds: ContentId[], message?: string): ResultAsync<TaskId, AppError> {
    if (contentIds.length === 0) {
        return errAsync(new AppError('No content to archive'));
    }

    const url = getCmsApiUrl('archive/archive');

    const payload = {
        contentIds: contentIds.map((id) => id.toString()),
        message: message?.trim() || null,
    };

    return requestJson<TaskIdJson>(url, { method: 'POST', body: payload }).map(TaskId.fromJson);
}

/**
 * Delete content items by their paths.
 * Returns a TaskId that can be tracked for progress.
 * Used by: (no external callers yet).
 */
export function deleteContent(contentPaths: ContentPath[]): ResultAsync<TaskId, AppError> {
    if (contentPaths.length === 0) {
        return errAsync(new AppError('No content to delete'));
    }

    const url = getCmsApiUrl('delete');

    const payload = {
        contentPaths: contentPaths.map((path) => path.toString()),
    };

    return requestJson<TaskIdJson>(url, { method: 'POST', body: payload }).map(TaskId.fromJson);
}

/**
 * Resolve delete dependencies for content items.
 * Returns content IDs to delete and inbound dependencies.
 * Used by: features/delete/model/deleteDialog.service.
 */
export function resolveForDelete(contentIds: ContentId[]): ResultAsync<ContentWithRefsResult, AppError> {
    if (contentIds.length === 0) {
        return errAsync(new AppError('No content IDs provided'));
    }

    const url = getCmsApiUrl('resolveForDelete');

    const payload = {
        contentIds: contentIds.map((id) => id.toString()),
    };

    return requestJson<ContentWithRefsResultJson>(url, { method: 'POST', body: payload }).map(
        ContentWithRefsResult.fromJson,
    );
}
