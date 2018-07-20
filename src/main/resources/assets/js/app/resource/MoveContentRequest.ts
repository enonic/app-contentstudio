import TaskIdJson = api.task.TaskIdJson;
import TaskId = api.task.TaskId;
import ContentResourceRequest = api.content.resource.ContentResourceRequest;
import ContentPath = api.content.ContentPath;
import ContentIds = api.content.ContentIds;

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

    getRequestPath(): api.rest.Path {
        return api.rest.Path.fromParent(super.getResourcePath(), 'move');
    }

    sendAndParse(): wemQ.Promise<TaskId> {
        return this.send().then((response: api.rest.JsonResponse<TaskIdJson>) => {
            return TaskId.fromJson(response.getResult());
        });
    }
}
