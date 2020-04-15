import {ContentId} from 'lib-admin-ui/content/ContentId';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {TaskIdJson} from 'lib-admin-ui/task/TaskIdJson';
import {TaskId} from 'lib-admin-ui/task/TaskId';
import {ContentResourceRequest} from './ContentResourceRequest';
import {HttpMethod} from 'lib-admin-ui/rest/HttpMethod';

export type DuplicatableId = {
    contentId: ContentId,
    includeChildren: boolean
};

export class DuplicateContentRequest
    extends ContentResourceRequest<TaskId> {

    private contents: DuplicatableId[];

    constructor(contents: DuplicatableId[]) {
        super();
        this.setHeavyOperation(true);
        this.setMethod(HttpMethod.POST);
        this.contents = contents;
        this.addRequestPathElements('duplicate');
    }

    getParams(): Object {
        return {
            contents: this.contents ? this.contents.map(value => {
                return {contentId: value.contentId.toString(), includeChildren: value.includeChildren};
            }) : []
        };
    }

    protected parseResponse(response: JsonResponse<TaskIdJson>): TaskId {
        return TaskId.fromJson(response.getResult());
    }
}
