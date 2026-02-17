import {type JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {type TaskIdJson} from '@enonic/lib-admin-ui/task/TaskIdJson';
import {TaskId} from '@enonic/lib-admin-ui/task/TaskId';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {type ContentId} from '../content/ContentId';
import {CmsContentResourceRequest} from './CmsContentResourceRequest';

export class PublishContentRequest
    extends CmsContentResourceRequest<TaskId> {

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

    getParams(): object {
        const schedule = this.publishFrom || this.publishTo ? {
            from: this.publishFrom ? this.publishFrom.toISOString() : new Date().toISOString(),
            to: this.publishTo ? this.publishTo.toISOString() : null
        } : null;

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
            schedule,
            message: this.message
        };
    }

    protected parseResponse(response: JsonResponse<TaskIdJson>): TaskId {
        return TaskId.fromJson(response.getResult());
    }
}
