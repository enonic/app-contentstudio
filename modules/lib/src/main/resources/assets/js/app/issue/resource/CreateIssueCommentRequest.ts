import {type JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {type IssueCommentJson} from '../json/IssueCommentJson';
import {IssueComment} from '../IssueComment';
import {type PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {CmsIssueResourceRequest} from './CmsIssueResourceRequest';

export class CreateIssueCommentRequest
    extends CmsIssueResourceRequest<IssueComment> {

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

    getParams(): object {
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
