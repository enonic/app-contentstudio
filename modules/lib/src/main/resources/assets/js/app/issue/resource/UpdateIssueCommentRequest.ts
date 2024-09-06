import {IssueCommentJson} from '../json/IssueCommentJson';
import {IssueComment} from '../IssueComment';
import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {CmsIssueResourceRequest} from './CmsIssueResourceRequest';

export class UpdateIssueCommentRequest
    extends CmsIssueResourceRequest<IssueComment> {

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

    getParams(): object {
        return {
            comment: this.commentId,
            text: this.text
        };
    }

    parseResponse(response: JsonResponse<IssueCommentJson>): IssueComment {
        return IssueComment.fromJson(response.getResult());
    }
}
