import {TaskId} from '@enonic/lib-admin-ui/task/TaskId';
import {TaskIdJson} from '@enonic/lib-admin-ui/task/TaskIdJson';
import {ContentId} from '../../../app/content/ContentId';
import {ContentIdBaseItemJson} from '../../../app/resource/json/ContentIdBaseItemJson';
import {ResolvePublishContentResultJson} from '../../../app/resource/json/ResolvePublishContentResultJson';
import {ResolvePublishDependenciesResult} from '../../../app/resource/ResolvePublishDependenciesResult';
import {getCmsApiUrl} from '../utils/url/cms';

//
// * Types
//

export type PublishContentParams = {
    ids: ContentId[];
    excludedIds?: ContentId[];
    excludeChildrenIds?: ContentId[];
    message?: string;
    schedule?: {
        from?: Date;
        to?: Date;
    };
};

export type ResolvePublishParams = {
    ids: ContentId[];
    excludedIds?: ContentId[];
    excludeChildrenIds?: ContentId[];
};

//
// * API
//

/**
 * Find all child content IDs for given parent content IDs.
 */
export async function findIdsByParents(contentIds: ContentId[]): Promise<ContentId[]> {
    if (contentIds.length === 0) {
        return [];
    }

    const url = getCmsApiUrl('findIdsByParents');

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

    const json: {ids: ContentIdBaseItemJson[]} = await response.json();
    return json.ids?.map(item => new ContentId(item.id)) ?? [];
}

/**
 * Mark content items as ready for publishing.
 */
export async function markAsReady(contentIds: ContentId[]): Promise<void> {
    if (contentIds.length === 0) {
        return;
    }

    const url = getCmsApiUrl('markAsReady');

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
}

/**
 * Publish content items.
 * Returns a TaskId that can be tracked for progress.
 */
export async function publishContent(params: PublishContentParams): Promise<TaskId> {
    if (params.ids.length === 0) {
        throw new Error('No content to publish');
    }

    const url = getCmsApiUrl('publish');

    const schedule = params.schedule?.from || params.schedule?.to
        ? {
            from: params.schedule.from?.toISOString() ?? new Date().toISOString(),
            to: params.schedule.to?.toISOString() ?? null,
        }
        : null;

    const payload = {
        ids: params.ids.map(id => id.toString()),
        excludedIds: params.excludedIds?.map(id => id.toString()) ?? [],
        excludeChildrenIds: params.excludeChildrenIds?.map(id => id.toString()) ?? [],
        schedule,
        message: params.message,
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
 * Resolve publish dependencies for content items.
 * Returns dependants, required items, invalid items, and other publish-related info.
 */
export async function resolvePublishDependencies(params: ResolvePublishParams): Promise<ResolvePublishDependenciesResult> {
    const url = getCmsApiUrl('resolvePublishContent');

    const payload = {
        ids: params.ids.map(id => id.toString()),
        excludedIds: params.excludedIds?.map(id => id.toString()) ?? [],
        excludeChildrenIds: params.excludeChildrenIds?.map(id => id.toString()) ?? [],
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

    const json: ResolvePublishContentResultJson = await response.json();
    return ResolvePublishDependenciesResult.fromJson(json);
}
