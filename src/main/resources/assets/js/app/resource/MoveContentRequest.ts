import * as Q from 'q';
import {Path} from 'lib-admin-ui/rest/Path';
import {ContentPath} from 'lib-admin-ui/content/ContentPath';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {TaskIdJson} from 'lib-admin-ui/task/TaskIdJson';
import {TaskId} from 'lib-admin-ui/task/TaskId';
import {ContentIds} from '../ContentIds';
import {ContentResourceRequest} from './ContentResourceRequest';

export class MoveContentRequest
    extends ContentResourceRequest<TaskIdJson, TaskId> {

    private ids: ContentIds;

    private parentPath: ContentPath;

    constructor(ids: ContentIds, parentPath: ContentPath) {
        super();
        this.setHeavyOperation(true);
        super.setMethod('POST');
        this.ids = ids;
        this.parentPath = parentPath;
    }

    getParams(): Object {
        return {
            contentIds: this.ids.map(id => id.toString()),
            parentContentPath: this.parentPath ? this.parentPath.toString() : ''
        };
    }

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), 'move');
    }

    sendAndParse(): Q.Promise<TaskId> {
        return this.send().then((response: JsonResponse<TaskIdJson>) => {
            return TaskId.fromJson(response.getResult());
        });
    }
}
