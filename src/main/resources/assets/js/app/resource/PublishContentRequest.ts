import TaskIdJson = api.task.TaskIdJson;
import TaskId = api.task.TaskId;
import ContentId = api.content.ContentId;
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
            schedule: {
                from: this.publishFrom ? this.publishFrom.toISOString() : null,
                to: this.publishTo ? this.publishTo.toISOString() : null
            },
            message: this.message
        };
    }

    getRequestPath(): api.rest.Path {
        return api.rest.Path.fromParent(super.getResourcePath(), 'publish');
    }

    sendAndParse(): wemQ.Promise<api.task.TaskId> {
        return this.send().then((response: api.rest.JsonResponse<api.task.TaskIdJson>) => {
            return api.task.TaskId.fromJson(response.getResult());
        });
    }
}
