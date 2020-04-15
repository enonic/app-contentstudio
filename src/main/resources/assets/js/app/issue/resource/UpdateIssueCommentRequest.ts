import {IssueCommentJson} from '../json/IssueCommentJson';
import {IssueResourceRequest} from './IssueResourceRequest';
import {IssueComment} from '../IssueComment';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {HttpMethod} from 'lib-admin-ui/rest/HttpMethod';

export class UpdateIssueCommentRequest
    extends IssueResourceRequest<IssueComment> {

    private text: string;
    private commentId: string;

    constructor(commentId: string) {
        super();
        this.setMethod(HttpMethod.POST);
        this.commentId = commentId;
        this.addRequestPathElements('comment', 'update');
    }

    setText(text: string) {
        this.text = text;
        return this;
    }

    getParams(): Object {
        return {
            comment: this.commentId,
            text: this.text
        };
    }

    parseResponse(response: JsonResponse<IssueCommentJson>): IssueComment {
        return IssueComment.fromJson(response.getResult());
    }
}
