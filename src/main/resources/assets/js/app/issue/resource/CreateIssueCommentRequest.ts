import {IssueCommentJson} from '../json/IssueCommentJson';
import {IssueResourceRequest} from './IssueResourceRequest';
import {IssueComment} from '../IssueComment';
import PrincipalKey = api.security.PrincipalKey;
import Path = api.rest.Path;
import JsonResponse = api.rest.JsonResponse;

export class CreateIssueCommentRequest
    extends IssueResourceRequest<IssueCommentJson, IssueComment> {

    private creator: PrincipalKey;
    private text: string;
    private issueId: string;

    constructor(issueId: string) {
        super();
        super.setMethod('POST');
        this.issueId = issueId;
    }

    setCreator(key: PrincipalKey) {
        this.creator = key;
        return this;
    }

    setText(text: string) {
        this.text = text;
        return this;
    }

    getParams(): Object {
        return {
            issue: this.issueId,
            text: this.text,
            creator: this.creator.toString()
        };
    }

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), 'comment');
    }

    sendAndParse(): wemQ.Promise<IssueComment> {
        return this.send().then((response: JsonResponse<IssueCommentJson>) => {
            return IssueComment.fromJson(response.getResult());
        });
    }
}
