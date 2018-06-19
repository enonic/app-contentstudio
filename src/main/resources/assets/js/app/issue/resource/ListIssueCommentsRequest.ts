import {IssueResourceRequest} from './IssueResourceRequest';
import {ListIssueCommentsResult} from './ListIssueCommentsResult';
import {ListIssueCommentsResponse} from './ListIssueCommentsResponse';
import {IssueComment} from '../IssueComment';
import {IssueMetadata} from '../IssueMetadata';
import PrincipalKey = api.security.PrincipalKey;
import Path = api.rest.Path;

export class ListIssueCommentsRequest
    extends IssueResourceRequest<ListIssueCommentsResult, ListIssueCommentsResponse> {

    private static DEFAULT_FETCH_SIZE: number = 150;

    private creator: PrincipalKey;

    private issueId: string;

    private from: number = 0;

    private size: number = ListIssueCommentsRequest.DEFAULT_FETCH_SIZE;

    private count: boolean;

    constructor(issueId: string) {
        super();
        super.setMethod('POST');
        this.issueId = issueId;
    }

    setCreator(key: PrincipalKey): ListIssueCommentsRequest {
        this.creator = key;
        return this;
    }

    setFrom(value: number): ListIssueCommentsRequest {
        this.from = value;
        return this;
    }

    setSize(value: number): ListIssueCommentsRequest {
        this.size = value;
        return this;
    }

    setCount(value: boolean): ListIssueCommentsRequest {
        this.count = value;
        return this;
    }

    getParams(): Object {
        return {
            issue: this.issueId,
            from: this.from,
            size: this.size,
            count: this.count,
            creator: this.creator ? this.creator.toString() : undefined
        };
    }

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), 'comment/list');
    }

    sendAndParse(): wemQ.Promise<ListIssueCommentsResponse> {
        return this.send().then((response: api.rest.JsonResponse<ListIssueCommentsResult>) => {

            const issueComments: IssueComment[] = response.getResult().issueComments.map(IssueComment.fromJson).sort((a, b) => {
                return a.getCreatedTime().getTime() - b.getCreatedTime().getTime();
            });

            const metadata: IssueMetadata = new IssueMetadata(response.getResult().metadata['hits'],
                response.getResult().metadata['totalHits']);

            return new ListIssueCommentsResponse(issueComments, metadata);
        });
    }
}
