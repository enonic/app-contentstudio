import * as Q from 'q';
import {Path} from 'lib-admin-ui/rest/Path';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {TaskIdJson} from 'lib-admin-ui/task/TaskIdJson';
import {TaskId} from 'lib-admin-ui/task/TaskId';
import {ContentResourceRequest} from './ContentResourceRequest';

export class PublishContentRequest
    extends ContentResourceRequest<TaskIdJson, TaskId> {

    private ids: ContentId[] = [];

    private excludedIds: ContentId[] = [];

    private excludeChildrenIds: ContentId[] = [];

    private publishFrom: Date;

    private publishTo: Date;

    private message: string;

    constructor(contentId?: ContentId) {
        super();
        super.setMethod('POST');
        if (contentId) {
            this.addId(contentId);
        }
    }

    setIds(contentIds: ContentId[]): PublishContentRequest {
        this.ids = contentIds;
        return this;
    }

    setExcludedIds(excludedIds: ContentId[]): PublishContentRequest {
        this.excludedIds = excludedIds;
        return this;
    }

    setExcludeChildrenIds(excludeIds: ContentId[]): PublishContentRequest {
        this.excludeChildrenIds = excludeIds;
        return this;
    }

    addId(contentId: ContentId): PublishContentRequest {
        this.ids.push(contentId);
        return this;
    }

    setPublishFrom(publishFrom: Date): PublishContentRequest {
        this.publishFrom = publishFrom;
        return this;
    }

    setPublishTo(publishTo: Date): PublishContentRequest {
        this.publishTo = publishTo;
        return this;
    }

    setMessage(message: string): PublishContentRequest {
        this.message = message;
        return this;
    }

    getParams(): Object {
        return {
            ids: this.ids.map((el) => {
                return el.toString();
            }),
            excludedIds: this.excludedIds.map((el) => {
                return el.toString();
            }),
            excludeChildrenIds: this.excludeChildrenIds.map((el) => {
                return el.toString();
            }),
            schedule: this.publishFrom ? {
                from: this.publishFrom.toISOString(),
                to: this.publishTo ? this.publishTo.toISOString() : null
            } : null,
            message: this.message
        };
    }

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), 'publish');
    }

    sendAndParse(): Q.Promise<TaskId> {
        return this.send().then((response: JsonResponse<TaskIdJson>) => {
            return TaskId.fromJson(response.getResult());
        });
    }
}
