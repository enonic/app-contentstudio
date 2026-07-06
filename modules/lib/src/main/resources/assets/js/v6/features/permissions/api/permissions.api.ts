import { ResultAsync, okAsync } from 'neverthrow';
import { TaskId } from '@enonic/lib-admin-ui/task/TaskId';
import { type TaskIdJson } from '@enonic/lib-admin-ui/task/TaskIdJson';
import { AccessControlList } from '../../../../app/access/AccessControlList';
import { type PermissionsJson } from '../../../../app/access/PermissionsJson';
import { ContentId } from '../../../../app/content/ContentId';
import { type ContentPath } from '../../../../app/content/ContentPath';
import { type ApplyPermissionsScope } from '../../../../app/dialog/permissions/PermissionsData';
import { type ContentIdBaseItemJson } from '../../../../app/resource/json/ContentIdBaseItemJson';
import { requestJson } from '../../../shared/api/client';
import { AppError } from '../../../shared/api/errors';
import { getCmsApiUrl } from '../../../shared/lib/url/cms';

export type ApplyContentPermissionsParams = {
    contentId: ContentId;
    scope: ApplyPermissionsScope;
    permissions?: AccessControlList;
    addPermissions?: AccessControlList;
    removePermissions?: AccessControlList;
};

/**
 * Resolve the ids of all descendants of the given content paths.
 * Used by: features/permissions/model/permissionsDialog.store.
 */
export function getDescendantsOfContents(contentPaths: ContentPath[]): ResultAsync<ContentId[], AppError> {
    if (contentPaths.length === 0) {
        return okAsync([]);
    }

    const payload = {
        contentPaths: contentPaths.map((path) => path.toString()),
    };

    return requestJson<ContentIdBaseItemJson[]>(getCmsApiUrl('getDescendantsOfContents'), {
        method: 'POST',
        body: payload,
    }).map((json) => json.map((item) => new ContentId(item.id)));
}

/**
 * Fetch the permissions of the content root.
 * Used by: features/permissions/model/permissionsDialog.store.
 */
export function fetchRootPermissions(): ResultAsync<AccessControlList, AppError> {
    return requestJson<PermissionsJson>(getCmsApiUrl('rootPermissions')).map(AccessControlList.fromJson);
}

/**
 * Apply permissions to a content, optionally propagating to its descendants.
 * Used by: features/permissions/model/permissionsDialog.store.
 */
export function applyContentPermissions(params: ApplyContentPermissionsParams): ResultAsync<TaskId, AppError> {
    const { contentId, scope, permissions, addPermissions, removePermissions } = params;

    const body = {
        contentId: contentId.toString(),
        ...(permissions && { permissions: permissions.toJson() }),
        ...(addPermissions && { addPermissions: addPermissions.toJson() }),
        ...(removePermissions && { removePermissions: removePermissions.toJson() }),
        scope: scope.toUpperCase(),
    };

    return requestJson<TaskIdJson>(getCmsApiUrl('applyPermissions'), { method: 'POST', body }).map(TaskId.fromJson);
}
