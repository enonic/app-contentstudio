import { ResultAsync, errAsync, okAsync } from 'neverthrow';
import { TaskId } from '@enonic/lib-admin-ui/task/TaskId';
import { type TaskIdJson } from '@enonic/lib-admin-ui/task/TaskIdJson';
import { CompareStatus } from '../../../../app/content/CompareStatus';
import { ContentId } from '../../../../app/content/ContentId';
import { type ContentPath } from '../../../../app/content/ContentPath';
import { type ContentIdBaseItemJson } from '../../../../app/resource/json/ContentIdBaseItemJson';
import { requestJson } from '../../../shared/api/client';
import { AppError } from '../../../shared/api/errors';
import { getCmsApiUrl } from '../../../shared/lib/url/cms';

type DuplicateContentParamsJson = {
    contentId: string;
    includeChildren: boolean;
    variant?: boolean;
    parent?: string;
    name?: string;
};

export type DuplicateContentParams = {
    contentId: ContentId;
    includeChildren: boolean;
    variant?: boolean;
    parent?: string;
    name?: string;
};

/**
 * Duplicate content items.
 * Returns a TaskId that can be tracked for progress.
 * Used by: features/duplicate/model/duplicateDialog.store.
 */
export function duplicateContent(params: DuplicateContentParams[]): ResultAsync<TaskId, AppError> {
    if (params.length === 0) {
        return errAsync(new AppError('No content to duplicate'));
    }

    const url = getCmsApiUrl('duplicate');

    const payload = {
        contents: params.map(
            (item): DuplicateContentParamsJson => ({
                contentId: item.contentId.toString(),
                includeChildren: item.includeChildren,
                variant: item.variant,
                parent: item.parent,
                name: item.name,
            }),
        ),
    };

    return requestJson<TaskIdJson>(url, { method: 'POST', body: payload }).map(TaskId.fromJson);
}

/**
 * Get all descendants of content items by their paths.
 * Optionally filter by compare statuses.
 * Used by: features/duplicate/model/duplicateDialog.service.
 */
export function getDescendantsOfContents(contentPaths: ContentPath[]): ResultAsync<ContentId[], AppError> {
    if (contentPaths.length === 0) {
        return okAsync([]);
    }

    const url = getCmsApiUrl('getDescendantsOfContents');

    const payload = {
        contentPaths: contentPaths.map((path) => path.toString()),
    };

    return requestJson<ContentIdBaseItemJson[]>(url, { method: 'POST', body: payload }).map((json) =>
        json.map((item) => new ContentId(item.id)),
    );
}
