import {ContentId} from 'lib-admin-ui/content/ContentId';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {IssueResourceRequest} from './IssueResourceRequest';
import {IssueStatus} from '../IssueStatus';
import {Issue} from '../Issue';
import {FindIssuesResult} from './FindIssuesResult';
import {HttpMethod} from 'lib-admin-ui/rest/HttpMethod';

export class FindIssuesRequest
    extends IssueResourceRequest<Issue[]> {

    private static DEFAULT_FETCH_SIZE: number = 10;

    private issueStatus: IssueStatus;

    private from: number = 0;

    private size: number = FindIssuesRequest.DEFAULT_FETCH_SIZE;

    private contentIds: ContentId[] = [];

    constructor() {
        super();
        this.setMethod(HttpMethod.POST);
        this.addRequestPathElements('findIssues');
    }

    setFrom(value: number): FindIssuesRequest {
        this.from = value;
        return this;
    }

    setSize(value: number): FindIssuesRequest {
        this.size = value;
        return this;
    }

    setIssueStatus(value: IssueStatus): FindIssuesRequest {
        this.issueStatus = value;
        return this;
    }

    setContentIds(ids: ContentId[]): FindIssuesRequest {
        if (ids && ids.length > 0) {
            this.contentIds = ids;
        } else {
            this.contentIds = [];
        }
        return this;
    }

    addContentId(id: ContentId): FindIssuesRequest {
        this.contentIds.push(id);
        return this;
    }

    getParams(): Object {
        return {
            status: IssueStatus[this.issueStatus],
            from: this.from,
            size: this.size,
            contentIds: this.contentIds.length > 0 ? this.contentIds.map(id => id.toString()) : []
        };
    }

    parseResponse(response: JsonResponse<FindIssuesResult>): Issue[] {
        const issues: Issue[] = response.getResult().issues.map(Issue.fromJson);

        issues.sort((a, b) => {
            return b.getModifiedTime().getTime() - a.getModifiedTime().getTime();
        });

        return issues;
    }
}
