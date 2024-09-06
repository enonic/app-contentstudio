import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {CmsIssueResourceRequest} from './CmsIssueResourceRequest';

export class DeleteIssueCommentRequest
    extends CmsIssueResourceRequest<boolean> {

    private commentId: string;

    constructor(commentId: string) {
        super();
        this.setMethod(HttpMethod.POST);
        this.commentId = commentId;
        this.addRequestPathElements('comment', 'delete');
    }

    getParams(): object {
        return {
            comment: this.commentId
        };
    }

    sendAndParse(): Q.Promise<boolean> {
        return this.send().then((response: JsonResponse<boolean>) => {
            return response.getResult()['ids'].length > 0;
        });
    }

    parseResponse(response: JsonResponse<boolean>): boolean {
        return response.getResult()['ids'].length > 0;
    }
}
