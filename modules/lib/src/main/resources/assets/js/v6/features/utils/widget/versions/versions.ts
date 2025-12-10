import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ContentVersion} from '../../../../../app/ContentVersion';
import {APP_NAME} from '../../cms/app/app';

export enum ContentOperation {
    CREATE = 'content.create',
    DUPLICATE = 'content.duplicate',
    IMPORT = 'content.import',
    UPDATE = 'content.update',
    PERMISSIONS = 'content.permissions',
    MOVE = 'content.move',
    SORT = 'content.sort',
    PATCH = 'content.patch',
    ARCHIVE = 'content.archive',
    RESTORE = 'content.restore',
    PUBLISH = 'content.publish',
    UNPUBLISH = 'content.unpublish',
}

export enum ContentField {
    displayName = 'displayName',
    data = 'data',
    x = 'x',
    page = 'page',
    owner = 'owner',
    language = 'language',
    publish = 'publish',
    workflow = 'workflow',
    variantOf = 'variantOf',
    attachments = 'attachments',
    name = 'name',
    parentPath = 'parentPath',
}

export type VersionPublishStatus = 'online' | 'offline' | 'was_online';

export const VERSIONS_WIDGET_KEY = `${APP_NAME}:versions`;

export const getVersionUser = (version: ContentVersion): string => {
    const key = version.getActions()[0]?.getUser();

    return key?.toString() ?? version.getModifierDisplayName();
}

export const getOperationLabel = (version: ContentVersion): string => {
    const action = version.getActions()[0]; // Working with the first action only for now

    // PRE CS6 versions do not have actions, CS6 unpublished versions may not have actions
    if (!action) {
        return i18n('status.edited');
    }

    if (action.getOperation() === ContentOperation.CREATE.toString()) {
        return i18n('status.created');
    }

    // Edited until 'Show all activities' mode is implemented
    return i18n('status.edited');
}
