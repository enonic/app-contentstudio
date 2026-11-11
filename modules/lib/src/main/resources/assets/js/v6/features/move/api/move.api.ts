import { ResultAsync, errAsync } from 'neverthrow';
import { requestJson } from '@enonic/ui-utils/request';
import { AppError } from '@enonic/ui-utils';
import { type ContentId } from '../../../../app/content/ContentId';
import { type ContentPath } from '../../../../app/content/ContentPath';
import { getCmsApiUrl } from '../../../shared/lib/url/cms';

/**
 * Move content items under a new parent. An empty parent path moves to the root.
 * Returns a task id that can be tracked for progress.
 * Used by: features/move/model/moveDialog.store.
 */
export function moveContent(contentIds: ContentId[], parentPath?: ContentPath): ResultAsync<string, AppError> {
    if (contentIds.length === 0) {
        return errAsync(new AppError('No content to move'));
    }

    const url = getCmsApiUrl('move');

    const payload = {
        contentIds: contentIds.map((id) => id.toString()),
        parentContentPath: parentPath?.toString() ?? '',
    };

    return requestJson<{ taskId: string }>(url, { method: 'POST', body: payload }).map(({ taskId }) => taskId);
}
