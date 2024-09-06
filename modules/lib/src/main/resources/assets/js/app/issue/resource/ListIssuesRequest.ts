import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {IssueResponse} from './IssueResponse';
import {ListIssuesResult} from './ListIssuesResult';
import {IssueStatus} from '../IssueStatus';
import {IssueWithAssigneesJson} from '../json/IssueWithAssigneesJson';
import {IssueWithAssignees} from '../IssueWithAssignees';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {CmsIssueResourceRequest} from './CmsIssueResourceRequest';
import {ResultMetadata} from '../../resource/ResultMetadata';

export class ListIssuesRequest
    extends CmsIssueResourceRequest<IssueResponse> {

    private static DEFAULT_FETCH_SIZE: number = 10;

    private issueStatus: IssueStatus;

    private from: number = 0;

    private size: number = ListIssuesRequest.DEFAULT_FETCH_SIZE;

    private assignedToMe: boolean = false;

    private createdByMe: boolean = false;

    private resolveAssignees: boolean = false;

    constructor() {
        super();
        this.setMethod(HttpMethod.POST);
        this.addRequestPathElements('list');
    }

    setFrom(value: number): ListIssuesRequest {
        this.from = value;
        return this;
    }

    setSize(value: number): ListIssuesRequest {
        this.size = value;
        return this;
    }

    setIssueStatus(value: IssueStatus): ListIssuesRequest {
        this.issueStatus = value;
        return this;
    }

    setAssignedToMe(value: boolean): ListIssuesRequest {
        this.assignedToMe = value;
        return this;
    }

    setCreatedByMe(value: boolean): ListIssuesRequest {
        this.createdByMe = value;
        return this;
    }

    setResolveAssignees(value: boolean): ListIssuesRequest {
        this.resolveAssignees = value;
        return this;
    }

    getParams(): object {
        return {
            type: this.issueStatus != null ? IssueStatus[this.issueStatus] : null,
            from: this.from,
            size: this.size,
            assignedToMe: this.assignedToMe,
            createdByMe: this.createdByMe,
            resolveAssignees: this.resolveAssignees
        };
    }

    parseResponse(response: JsonResponse<ListIssuesResult>): IssueResponse {
        const issuesWithAssignees: IssueWithAssignees[] = response.getResult().issues.map(
            (issueWithAssigneesJson: IssueWithAssigneesJson) => {
                return IssueWithAssignees.fromJson(issueWithAssigneesJson);
            });

        issuesWithAssignees.sort((a, b) => {
            return b.getIssue().getModifiedTime().getTime() - a.getIssue().getModifiedTime().getTime();
        });

        const metadata = ResultMetadata.fromJson(response.getResult().metadata);

        return new IssueResponse(issuesWithAssignees, metadata);
    }
}
