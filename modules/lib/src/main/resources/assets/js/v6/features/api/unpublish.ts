import {TaskId} from '@enonic/lib-admin-ui/task/TaskId';
import {TaskIdJson} from '@enonic/lib-admin-ui/task/TaskIdJson';
import {ContentId} from '../../../app/content/ContentId';
import {ContentSummaryAndCompareStatus} from '../../../app/content/ContentSummaryAndCompareStatus';
import {ContentIdBaseItemJson} from '../../../app/resource/json/ContentIdBaseItemJson';
import {InboundDependenciesJson} from '../../../app/resource/json/InboundDependenciesJson';
import {getCmsApiUrl} from '../utils/url/cms';

type ContentWithRefsResultJson = {
    contentIds: ContentIdBaseItemJson[];
    inboundDependencies: InboundDependenciesJson[];
};

export type ResolveUnpublishResult = {
    contentIds: ContentId[];
    inboundDependencies: {
        id: ContentId;
        inboundDependencies: ContentId[];
    }[];
};

export async function resolveUnpublish(contentIds: ContentId[]): Promise<ResolveUnpublishResult | undefined> {
    const url = getCmsApiUrl('resolveForUnpublish');

    const payload = {
        contentIds: contentIds.map(id => id.toString()),
    };

    try {
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

        return {
            contentIds: json.contentIds?.map(item => new ContentId(item.id)) ?? [],
            inboundDependencies: json.inboundDependencies?.map(dep => ({
                id: new ContentId(dep.id.id),
                inboundDependencies: dep.inboundDependencies?.map(item => new ContentId(item.id)) ?? [],
            })) ?? [],
        };
    } catch (error) {
        console.error(error);
        return undefined;
    }
}

export type UnpublishOptions = {
    contentIds: ContentId[];
    includeChildren?: boolean;
};

export async function unpublishContent(options: UnpublishOptions): Promise<TaskId>;
export async function unpublishContent(items: ContentSummaryAndCompareStatus[], includeChildren?: boolean): Promise<TaskId>;
export async function unpublishContent(
    optionsOrItems: UnpublishOptions | ContentSummaryAndCompareStatus[],
    includeChildren = true,
): Promise<TaskId> {
    const url = getCmsApiUrl('unpublish');

    let ids: string[];
    let includeChildrenFlag: boolean;

    if (Array.isArray(optionsOrItems)) {
        ids = optionsOrItems.map(item => item.getContentId().toString());
        includeChildrenFlag = includeChildren;
    } else {
        ids = optionsOrItems.contentIds.map(id => id.toString());
        includeChildrenFlag = optionsOrItems.includeChildren ?? true;
    }

    const payload = {
        ids,
        includeChildren: includeChildrenFlag,
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
