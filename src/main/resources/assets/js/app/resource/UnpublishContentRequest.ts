import * as Q from 'q';
import {Path} from 'lib-admin-ui/rest/Path';
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

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), 'unpublish');
    }

    sendAndParse(): Q.Promise<TaskId> {
        return this.send().then((response: JsonResponse<TaskIdJson>) => {
            return TaskId.fromJson(response.getResult());
        });
    }
}
