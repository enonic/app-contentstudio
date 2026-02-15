import {type JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {type TaskIdJson} from '@enonic/lib-admin-ui/task/TaskIdJson';
import {TaskId} from '@enonic/lib-admin-ui/task/TaskId';
import {type ContentIds} from '../content/ContentIds';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {type ContentPath} from '../content/ContentPath';
import {CmsContentResourceRequest} from './CmsContentResourceRequest';

export class MoveContentRequest
    extends CmsContentResourceRequest<TaskId> {

    private readonly ids: ContentIds;

    private readonly parentPath: ContentPath;

    constructor(ids: ContentIds, parentPath: ContentPath) {
        super();
        this.setHeavyOperation(true);
        this.setMethod(HttpMethod.POST);
        this.ids = ids;
        this.parentPath = parentPath;
        this.addRequestPathElements('move');
    }

    getParams(): object {
        return {
            contentIds: this.ids.map(id => id.toString()),
            parentContentPath: this.parentPath ? this.parentPath.toString() : ''
        };
    }

    protected parseResponse(response: JsonResponse<TaskIdJson>): TaskId {
        return TaskId.fromJson(response.getResult());
    }
}
