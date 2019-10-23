import * as Q from 'q';
import {Path} from 'lib-admin-ui/rest/Path';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {TaskIdJson} from 'lib-admin-ui/task/TaskIdJson';
import {TaskId} from 'lib-admin-ui/task/TaskId';
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

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), 'duplicate');
    }

    sendAndParse(): Q.Promise<TaskId> {
        return this.send().then((response: JsonResponse<TaskIdJson>) => {
            return TaskId.fromJson(response.getResult());
        });
    }
}
