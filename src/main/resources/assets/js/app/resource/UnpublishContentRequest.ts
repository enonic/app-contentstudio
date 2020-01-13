import {ContentId} from 'lib-admin-ui/content/ContentId';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {TaskIdJson} from 'lib-admin-ui/task/TaskIdJson';
import {TaskId} from 'lib-admin-ui/task/TaskId';
import {ContentResourceRequest} from './ContentResourceRequest';

export class UnpublishContentRequest
    extends ContentResourceRequest<TaskIdJson, TaskId> {

    private ids: ContentId[] = [];

    private includeChildren: boolean;

    constructor(contentId?: ContentId) {
        super();
        this.setHeavyOperation(true);
        super.setMethod('POST');
        if (contentId) {
            this.addId(contentId);
        }
        this.addRequestPathElements('unpublish');
    }

    setIds(contentIds: ContentId[]): UnpublishContentRequest {
        this.ids = contentIds;
        return this;
    }

    addId(contentId: ContentId): UnpublishContentRequest {
        this.ids.push(contentId);
        return this;
    }

    setIncludeChildren(include: boolean): UnpublishContentRequest {
        this.includeChildren = include;
        return this;
    }

    getParams(): Object {
        return {
            includeChildren: this.includeChildren,
            ids: this.ids.map((el) => {
                return el.toString();
            })
        };
    }

    protected processResponse(response: JsonResponse<TaskIdJson>): TaskId {
        return TaskId.fromJson(response.getResult());
    }
}
