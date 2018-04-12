import {IssueResourceRequest} from './IssueResourceRequest';
import Path = api.rest.Path;
import JsonResponse = api.rest.JsonResponse;

export class DeleteIssueCommentRequest
    extends IssueResourceRequest<any, boolean> {

    private commentId: string;

    constructor(commentId: string) {
        super();
        super.setMethod('POST');
        this.commentId = commentId;
    }

    getParams(): Object {
        return {
            comment: this.commentId
        };
    }

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), 'comment/delete');
    }

    sendAndParse(): wemQ.Promise<boolean> {
        return this.send().then((response: JsonResponse<any>) => {
            return response.getResult()['ids'].length > 0;
        });
    }
}
