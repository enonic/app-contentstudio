import TaskIdJson = api.task.TaskIdJson;
import TaskId = api.task.TaskId;
import ContentId = api.content.ContentId;
import {ContentResourceRequest} from './ContentResourceRequest';

export type DuplicatableId = {
    contentId: ContentId,
    includeChildren: boolean
};

export class DuplicateContentRequest
    extends ContentResourceRequest<TaskIdJson, TaskId> {

    private contents: DuplicatableId[];

    constructor(contents: DuplicatableId[]) {
        super();
        this.setHeavyOperation(true);
        super.setMethod('POST');
        this.contents = contents;
    }

    getParams(): Object {
        return {
            contents: this.contents ? this.contents.map(value => {
                return {contentId: value.contentId.toString(), includeChildren: value.includeChildren};
            }) : []
        };
    }

    getRequestPath(): api.rest.Path {
        return api.rest.Path.fromParent(super.getResourcePath(), 'duplicate');
    }

    sendAndParse(): wemQ.Promise<TaskId> {
        return this.send().then((response: api.rest.JsonResponse<TaskIdJson>) => {
            return TaskId.fromJson(response.getResult());
        });
    }
}
