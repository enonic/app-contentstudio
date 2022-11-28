import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {TaskIdJson} from '@enonic/lib-admin-ui/task/TaskIdJson';
import {TaskId} from '@enonic/lib-admin-ui/task/TaskId';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {CmsContentResourceRequest} from './CmsContentResourceRequest';
import {ContentDuplicateParams} from './ContentDuplicateParams';

export class DuplicateContentRequest
    extends CmsContentResourceRequest<TaskId> {

    private readonly contents: ContentDuplicateParams[];

    constructor(contents: ContentDuplicateParams[]) {
        super();
        this.setHeavyOperation(true);
        this.setMethod(HttpMethod.POST);
        this.contents = contents || [];
        this.addRequestPathElements('duplicate');
    }

    getParams(): Object {
        return {
            contents: this.contents.map((item: ContentDuplicateParams) => item.toJson())
        };
    }

    protected parseResponse(response: JsonResponse<TaskIdJson>): TaskId {
        return TaskId.fromJson(response.getResult());
    }
}
