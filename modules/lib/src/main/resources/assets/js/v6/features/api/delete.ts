import {TaskId} from '@enonic/lib-admin-ui/task/TaskId';
import {TaskIdJson} from '@enonic/lib-admin-ui/task/TaskIdJson';
import {ContentId} from '../../../app/content/ContentId';
import {ContentPath} from '../../../app/content/ContentPath';
import {ContentWithRefsResult} from '../../../app/resource/ContentWithRefsResult';
import {ContentWithRefsResultJson} from '../../../app/resource/json/ContentWithRefsResultJson';
import {getCmsApiUrl} from '../utils/url/cms';

//
// * API
//

/**
 * Archive content items.
 * Returns a TaskId that can be tracked for progress.
 */
export async function archiveContent(contentIds: ContentId[], message?: string): Promise<TaskId> {
    if (contentIds.length === 0) {
        throw new Error('No content to archive');
    }

    const url = getCmsApiUrl('archive/archive');

    const payload = {
        contentIds: contentIds.map(id => id.toString()),
        message: message?.trim() || null,
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error(response.statusText);
    }

    const json: TaskIdJson = await response.json();
    return TaskId.fromJson(json);
}

/**
 * Delete content items by their paths.
 * Returns a TaskId that can be tracked for progress.
 */
export async function deleteContent(contentPaths: ContentPath[]): Promise<TaskId> {
    if (contentPaths.length === 0) {
        throw new Error('No content to delete');
    }

    const url = getCmsApiUrl('delete');

    const payload = {
        contentPaths: contentPaths.map(path => path.toString()),
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error(response.statusText);
    }

    const json: TaskIdJson = await response.json();
    return TaskId.fromJson(json);
}

/**
 * Resolve delete dependencies for content items.
 * Returns content IDs to delete and inbound dependencies.
 */
export async function resolveForDelete(contentIds: ContentId[]): Promise<ContentWithRefsResult> {
    if (contentIds.length === 0) {
        throw new Error('No content IDs provided');
    }

    const url = getCmsApiUrl('resolveForDelete');

    const payload = {
        contentIds: contentIds.map(id => id.toString()),
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error(response.statusText);
    }

    const json: ContentWithRefsResultJson = await response.json();
    return ContentWithRefsResult.fromJson(json);
}
