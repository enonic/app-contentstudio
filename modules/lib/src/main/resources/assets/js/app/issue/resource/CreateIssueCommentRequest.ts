import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {IssueCommentJson} from '../json/IssueCommentJson';
import {IssueResourceRequest} from './IssueResourceRequest';
import {IssueComment} from '../IssueComment';
import {PrincipalKey} from 'lib-admin-ui/security/PrincipalKey';
import {HttpMethod} from 'lib-admin-ui/rest/HttpMethod';

export class CreateIssueCommentRequest
    extends IssueResourceRequest<IssueComment> {

    private creator: PrincipalKey;
    private text: string;
    private issueId: string;
    private silent: boolean;

    constructor(issueId: string) {
        super();
        this.setMethod(HttpMethod.POST);
        this.issueId = issueId;
        this.addRequestPathElements('comment');
    }

    setCreator(key: PrincipalKey) {
        this.creator = key;
        return this;
    }

    setText(text: string) {
        this.text = text;
        return this;
    }

    setSilent(silent: boolean) {
        this.silent = silent;
        return this;
    }

    getParams(): Object {
        return {
            issue: this.issueId,
            text: this.text,
            creator: this.creator.toString(),
            silent: this.silent
        };
    }

    parseResponse(response: JsonResponse<IssueCommentJson>): IssueComment {
        return IssueComment.fromJson(response.getResult());
    }
}
