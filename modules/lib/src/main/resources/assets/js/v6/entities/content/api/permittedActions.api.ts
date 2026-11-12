import { type ResultAsync } from 'neverthrow';
import { requestJson } from '@enonic/ui-utils/request';
import type { AppError } from '@enonic/ui-utils';
import { getCmsApiUrl } from '../../../shared/lib/url/cms';

export type ContentPermission =
    | 'READ'
    | 'CREATE'
    | 'MODIFY'
    | 'DELETE'
    | 'PUBLISH'
    | 'READ_PERMISSIONS'
    | 'WRITE_PERMISSIONS';

/**
 * Fetch which of the given permissions the current user has on every listed
 * content item. Without content ids the permissions are checked on the root.
 * Used by: pages/browse/model/browseActions.service.
 */
export function fetchPermittedActions(
    contentIds: readonly string[],
    permissions: readonly ContentPermission[],
): ResultAsync<ContentPermission[], AppError> {
    return requestJson<ContentPermission[]>(getCmsApiUrl('allowedActions'), {
        method: 'POST',
        body: { contentIds, permissions },
    });
}
