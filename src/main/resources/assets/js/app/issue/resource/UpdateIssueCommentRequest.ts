import {IssueCommentJson} from '../json/IssueCommentJson';
import {IssueResourceRequest} from './IssueResourceRequest';
import {IssueComment} from '../IssueComment';
import {Path} from 'lib-admin-ui/rest/Path';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';

export class UpdateIssueCommentRequest
    extends IssueResourceRequest<IssueCommentJson, IssueComment> {

    private text: string;
    private commentId: string;

    constructor(commentId: string) {
        super();
        super.setMethod('POST');
        this.commentId = commentId;
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

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), 'comment/update');
    }

    sendAndParse(): Q.Promise<IssueComment> {
        return this.send().then((response: JsonResponse<IssueCommentJson>) => {
            return IssueComment.fromJson(response.getResult());
        });
    }
}
