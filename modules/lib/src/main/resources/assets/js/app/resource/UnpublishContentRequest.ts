import {type JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {type TaskIdJson} from '@enonic/lib-admin-ui/task/TaskIdJson';
import {TaskId} from '@enonic/lib-admin-ui/task/TaskId';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {type ContentId} from '../content/ContentId';
import {CmsContentResourceRequest} from './CmsContentResourceRequest';

export class UnpublishContentRequest
    extends CmsContentResourceRequest<TaskId> {

    private ids: ContentId[] = [];

    private includeChildren: boolean;

    constructor(contentId?: ContentId) {
        super();
        this.setHeavyOperation(true);
        this.setMethod(HttpMethod.POST);
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

    getParams(): object {
        return {
            includeChildren: this.includeChildren,
            ids: this.ids.map((el) => {
                return el.toString();
            })
        };
    }

    protected parseResponse(response: JsonResponse<TaskIdJson>): TaskId {
        return TaskId.fromJson(response.getResult());
    }
}
