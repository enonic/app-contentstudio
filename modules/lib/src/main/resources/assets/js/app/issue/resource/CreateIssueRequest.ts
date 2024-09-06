import {PublishRequest} from '../PublishRequest';
import {IssueJson} from '../json/IssueJson';
import {Issue} from '../Issue';
import {IssueType} from '../IssueType';
import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {CmsIssueResourceRequest} from './CmsIssueResourceRequest';

export class CreateIssueRequest
    extends CmsIssueResourceRequest<Issue> {

    private title: string;

    private description: string;

    private approvers: PrincipalKey[] = [];

    private publishRequest: PublishRequest;

    private publishFrom: Date;

    private publishTo: Date;

    private type: IssueType;

    constructor() {
        super();
        this.setMethod(HttpMethod.POST);
        this.addRequestPathElements('create');
    }

    setTitle(value: string): CreateIssueRequest {
        this.title = value;
        return this;
    }

    setDescription(value: string): CreateIssueRequest {
        this.description = value;
        return this;
    }

    setApprovers(value: PrincipalKey[]): CreateIssueRequest {
        this.approvers = value;
        return this;
    }

    setPublishRequest(value: PublishRequest): CreateIssueRequest {
        this.publishRequest = value;
        return this;
    }

    setPublishFrom(date: Date): CreateIssueRequest {
        this.publishFrom = date;
        return this;
    }

    setPublishTo(date: Date): CreateIssueRequest {
        this.publishTo = date;
        return this;
    }

    setType(type: IssueType): CreateIssueRequest {
        this.type = type;
        return this;
    }

    getParams(): object {
        return {
            title: this.title ? this.title.toString() : '',
            description: this.description ? this.description.toString() : '',
            approvers: this.approvers ? this.approvers.map((el) => {
                return el.toString();
            }) : undefined,
            publishRequest: this.publishRequest.toJson(),
            type: this.type ? IssueType[this.type] : undefined,
            schedule: this.publishFrom ? {
                from: this.publishFrom.toISOString(),
                to: this.publishTo ? this.publishTo.toISOString() : null
            } : null,
        };
    }

    parseResponse(response: JsonResponse<IssueJson>): Issue {
        return Issue.fromJson(response.getResult());
    }
}
