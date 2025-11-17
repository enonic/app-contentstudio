import {i18n} from '@enonic/lib-admin-ui/util/Messages';

export type ContentStatus =
    'unpublished'
    | 'new'
    | 'scheduled'
    | 'modified'
    | 'expired'
    | 'moved'
    | 'outofdate'
    | 'published'
    | 'archived'
    | 'unknown';

export type CS6ContentStatus = 'online' | 'offline' | 'scheduled' | 'expired';

export type ContentState = ContentStatus | ContentStatus[]; // supports complex statuses like ['moved','modified'], ['scheduled','modified'] etc.

export function contentStateToString(contentState: ContentState): string {
    if (Array.isArray(contentState)) {
        return contentState.map(cs => i18n(`status.${cs}`)).join(', ');
    }

    return i18n(`status.${contentState}`);
}

export function contentStateAsArray(contentState: ContentState): ContentStatus[] {
    if (Array.isArray(contentState)) {
        return contentState.slice();
    }

    return [contentState];
}

export function toCS6ContentStatus(contentState: ContentState): CS6ContentStatus {
    switch (contentState) {
    case 'unpublished':
    case 'new':
    case 'unknown':
        return 'offline'
    case 'scheduled':
        return 'scheduled'
    case 'expired':
    case 'outofdate':
        return 'expired'
    case 'published':
    case 'modified':
        return 'online'
    default:
        return 'offline';
    }
}
