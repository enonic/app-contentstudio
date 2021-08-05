import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {HttpMethod} from 'lib-admin-ui/rest/HttpMethod';
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

    getParams(): Object {
        return {
            comment: this.commentId
        };
    }

    sendAndParse(): Q.Promise<boolean> {
        return this.send().then((response: JsonResponse<any>) => {
            return response.getResult()['ids'].length > 0;
        });
    }

    parseResponse(response: JsonResponse<any>): boolean {
        return response.getResult()['ids'].length > 0;
    }
}
