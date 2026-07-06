import { ResultAsync, errAsync } from 'neverthrow';
import { TaskId } from '@enonic/lib-admin-ui/task/TaskId';
import { type TaskIdJson } from '@enonic/lib-admin-ui/task/TaskIdJson';
import { type ContentId } from '../../../../app/content/ContentId';
import { type ContentPath } from '../../../../app/content/ContentPath';
import { requestJson } from '../../../shared/api/client';
import { AppError } from '../../../shared/api/errors';
import { getCmsApiUrl } from '../../../shared/lib/url/cms';

/**
 * Move content items under a new parent. An empty parent path moves to the root.
 * Returns a TaskId that can be tracked for progress.
 * Used by: features/move/model/moveDialog.store.
 */
export function moveContent(contentIds: ContentId[], parentPath?: ContentPath): ResultAsync<TaskId, AppError> {
    if (contentIds.length === 0) {
        return errAsync(new AppError('No content to move'));
    }

    const url = getCmsApiUrl('move');

    const payload = {
        contentIds: contentIds.map((id) => id.toString()),
        parentContentPath: parentPath?.toString() ?? '',
    };

    return requestJson<TaskIdJson>(url, { method: 'POST', body: payload }).map(TaskId.fromJson);
}
