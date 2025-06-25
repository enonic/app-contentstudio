import {TaskId} from '@enonic/lib-admin-ui/task/TaskId';
import {TaskIdJson} from '@enonic/lib-admin-ui/task/TaskIdJson';
import {CompareStatus} from '../../../app/content/CompareStatus';
import {ContentId} from '../../../app/content/ContentId';
import {ContentPath} from '../../../app/content/ContentPath';
import {ContentIdBaseItemJson} from '../../../app/resource/json/ContentIdBaseItemJson';
import {getCmsApiUrl} from '../utils/url/cms';

//
// * Types
//

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

//
// * API
//

/**
 * Duplicate content items.
 * Returns a TaskId that can be tracked for progress.
 */
export async function duplicateContent(params: DuplicateContentParams[]): Promise<TaskId> {
    if (params.length === 0) {
        throw new Error('No content to duplicate');
    }

    const url = getCmsApiUrl('duplicate');

    const payload = {
        contents: params.map((item): DuplicateContentParamsJson => ({
            contentId: item.contentId.toString(),
            includeChildren: item.includeChildren,
            variant: item.variant,
            parent: item.parent,
            name: item.name,
        })),
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
 * Get all descendants of content items by their paths.
 * Optionally filter by compare statuses.
 */
export async function getDescendantsOfContents(
    contentPaths: ContentPath[],
    filterStatuses?: CompareStatus[],
): Promise<ContentId[]> {
    if (contentPaths.length === 0) {
        return [];
    }

    const url = getCmsApiUrl('getDescendantsOfContents');

    const payload = {
        contentPaths: contentPaths.map(path => path.toString()),
        filterStatuses: filterStatuses?.map(status => CompareStatus[status]) ?? [],
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

    const json: ContentIdBaseItemJson[] = await response.json();
    return json.map(item => new ContentId(item.id));
}
