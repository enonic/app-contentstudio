import {type JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {type TaskIdJson} from '@enonic/lib-admin-ui/task/TaskIdJson';
import {TaskId} from '@enonic/lib-admin-ui/task/TaskId';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {type ContentId} from '../content/ContentId';
import {CmsContentResourceRequest} from './CmsContentResourceRequest';

export class ArchiveContentRequest extends CmsContentResourceRequest<TaskId> {

    private contentIds: ContentId[] = [];

    private message: string;

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

    setArchiveMessage(value: string): void {
        this.message = value;
    }

    getParams(): object {
        const fn = (contentId: ContentId) => {
            return contentId.toString();
        };

        return {
            contentIds: this.contentIds.map(fn),
            message: StringHelper.isBlank(this.message) ? null : this.message,
        };
    }

    protected parseResponse(response: JsonResponse<TaskIdJson>): TaskId {
        return TaskId.fromJson(response.getResult());
    }
}
