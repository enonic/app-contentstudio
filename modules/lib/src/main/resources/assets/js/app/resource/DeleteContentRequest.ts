import {type JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {type TaskIdJson} from '@enonic/lib-admin-ui/task/TaskIdJson';
import {TaskId} from '@enonic/lib-admin-ui/task/TaskId';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {type ContentPath} from '../content/ContentPath';
import {CmsContentResourceRequest} from './CmsContentResourceRequest';

export class DeleteContentRequest
    extends CmsContentResourceRequest<TaskId> {

    private contentPaths: ContentPath[] = [];

    constructor(contentPath?: ContentPath) {
        super();
        this.setHeavyOperation(true);
        this.setMethod(HttpMethod.POST);
        if (contentPath) {
            this.addContentPath(contentPath);
        }
        this.addRequestPathElements('delete');
    }

    setContentPaths(contentPaths: ContentPath[]): DeleteContentRequest {
        this.contentPaths = contentPaths;
        return this;
    }

    addContentPath(contentPath: ContentPath): DeleteContentRequest {
        this.contentPaths.push(contentPath);
        return this;
    }

    getParams(): object {
        const fn = (contentPath: ContentPath) => {
            return contentPath.toString();
        };
        return {
            contentPaths: this.contentPaths.map(fn),
        };
    }

    protected parseResponse(response: JsonResponse<TaskIdJson>): TaskId {
        return TaskId.fromJson(response.getResult());
    }
}
