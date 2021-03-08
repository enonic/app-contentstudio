import {ContentId} from 'lib-admin-ui/content/ContentId';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {TaskIdJson} from 'lib-admin-ui/task/TaskIdJson';
import {TaskId} from 'lib-admin-ui/task/TaskId';
import {ContentResourceRequest} from './ContentResourceRequest';
import {HttpMethod} from 'lib-admin-ui/rest/HttpMethod';

export class PublishContentRequest
    extends ContentResourceRequest<TaskId> {

    private ids: ContentId[] = [];

    private excludedIds: ContentId[] = [];

    private excludeChildrenIds: ContentId[] = [];

    private publishFrom: Date;

    private publishTo: Date;

    private message: string;

    constructor(contentId?: ContentId) {
        super();
        this.setMethod(HttpMethod.POST);
        if (contentId) {
            this.addId(contentId);
        }
        this.addRequestPathElements('publish');
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

    protected parseResponse(response: JsonResponse<TaskIdJson>): TaskId {
        return TaskId.fromJson(response.getResult());
    }
}
