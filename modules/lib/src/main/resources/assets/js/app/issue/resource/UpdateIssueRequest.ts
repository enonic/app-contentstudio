import {type JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {type IssueJson} from '../json/IssueJson';
import {Issue} from '../Issue';
import {IssueStatus} from '../IssueStatus';
import {type PublishRequest} from '../PublishRequest';
import {type PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {CmsIssueResourceRequest} from './CmsIssueResourceRequest';

export class UpdateIssueRequest
    extends CmsIssueResourceRequest<Issue> {

    private id: string;

    private title: string;

    private description: string;

    private issueStatus: IssueStatus;

    private isPublish: boolean = false;

    private autoSave: boolean = false;

    private approvers: PrincipalKey[];

    private publishFrom: Date;

    private publishTo: Date;

    private publishRequest: PublishRequest;

    constructor(id: string) {
        super();
        this.setMethod(HttpMethod.POST);
        this.id = id;
        this.addRequestPathElements('update');
    }

    setId(id: string): UpdateIssueRequest {
        this.id = id;
        return this;
    }

    setTitle(title: string): UpdateIssueRequest {
        this.title = title;
        return this;
    }

    setDescription(description: string): UpdateIssueRequest {
        this.description = description;
        return this;
    }

    setIssueStatus(status: IssueStatus): UpdateIssueRequest {
        this.issueStatus = status;
        return this;
    }

    setIsPublish(value: boolean): UpdateIssueRequest {
        this.isPublish = value;
        return this;
    }

    setAutoSave(value: boolean): UpdateIssueRequest {
        this.autoSave = value;
        return this;
    }

    setApprovers(approvers: PrincipalKey[]): UpdateIssueRequest {
        this.approvers = approvers;
        return this;
    }

    setPublishRequest(publishRequest: PublishRequest): UpdateIssueRequest {
        this.publishRequest = publishRequest;
        return this;
    }

    setPublishFrom(publishFrom: Date): UpdateIssueRequest {
        this.publishFrom = publishFrom;
        return this;
    }

    setPublishTo(publishTo: Date): UpdateIssueRequest {
        this.publishTo = publishTo;
        return this;
    }

    getParams(): object {
        const approvers = this.approvers ? this.approvers.map((el) => el.toString()) : undefined;
        const publishRequest = this.publishRequest ? this.publishRequest.toJson() : undefined;
        return {
            id: this.id,
            title: this.title,
            description: this.description,
            status: IssueStatus[this.issueStatus],
            publishSchedule: {
                from: this.publishFrom ? this.publishFrom.toISOString() : null,
                to: this.publishTo ? this.publishTo.toISOString() : null
            },
            isPublish: this.isPublish,
            autoSave: this.autoSave,
            approvers,
            publishRequest,
        };
    }

    parseResponse(response: JsonResponse<IssueJson>): Issue {
        return Issue.fromJson(response.getResult());
    }
}
