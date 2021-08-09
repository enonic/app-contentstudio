import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {TaskIdJson} from 'lib-admin-ui/task/TaskIdJson';
import {TaskId} from 'lib-admin-ui/task/TaskId';
import {HttpMethod} from 'lib-admin-ui/rest/HttpMethod';
import {ContentId} from '../content/ContentId';
import {CmsContentResourceRequest} from './CmsContentResourceRequest';

export class ArchiveContentRequest extends CmsContentResourceRequest<TaskId> {

    private contentIds: ContentId[] = [];

    constructor() {
        super();
        this.setHeavyOperation(true);
        this.setMethod(HttpMethod.POST);
        this.addRequestPathElements('archive', 'archive');
    }

    setContentIds(contentIds: ContentId[]): ArchiveContentRequest {
        this.contentIds = contentIds;
        return this;
    }

    addContentId(contentId: ContentId): ArchiveContentRequest {
        this.contentIds.push(contentId);
        return this;
    }

    getParams(): Object {
        const fn = (contentId: ContentId) => {
            return contentId.toString();
        };

        return {
            contentIds: this.contentIds.map(fn),
        };
    }

    protected parseResponse(response: JsonResponse<TaskIdJson>): TaskId {
        return TaskId.fromJson(response.getResult());
    }
}
