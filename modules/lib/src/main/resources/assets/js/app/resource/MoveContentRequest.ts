import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {TaskIdJson} from 'lib-admin-ui/task/TaskIdJson';
import {TaskId} from 'lib-admin-ui/task/TaskId';
import {ContentIds} from '../content/ContentIds';
import {ContentResourceRequest} from './ContentResourceRequest';
import {HttpMethod} from 'lib-admin-ui/rest/HttpMethod';
import {ContentPath} from '../content/ContentPath';

export class MoveContentRequest
    extends ContentResourceRequest<TaskId> {

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

    getParams(): Object {
        return {
            contentIds: this.ids.map(id => id.toString()),
            parentContentPath: this.parentPath ? this.parentPath.toString() : ''
        };
    }

    protected parseResponse(response: JsonResponse<TaskIdJson>): TaskId {
        return TaskId.fromJson(response.getResult());
    }
}
