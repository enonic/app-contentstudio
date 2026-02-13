import {type JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {type ListIssueCommentsResult} from './ListIssueCommentsResult';
import {ListIssueCommentsResponse} from './ListIssueCommentsResponse';
import {IssueComment} from '../IssueComment';
import {type PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {CmsIssueResourceRequest} from './CmsIssueResourceRequest';
import {ResultMetadata} from '../../resource/ResultMetadata';

export class ListIssueCommentsRequest
    extends CmsIssueResourceRequest<ListIssueCommentsResponse> {

    private static DEFAULT_FETCH_SIZE: number = 150;

    private creator: PrincipalKey;

    private issueId: string;

    private from: number = 0;

    private size: number = ListIssueCommentsRequest.DEFAULT_FETCH_SIZE;

    private count: boolean;

    constructor(issueId: string) {
        super();
        this.setMethod(HttpMethod.POST);
        this.issueId = issueId;
        this.addRequestPathElements('comment', 'list');
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

    getParams(): object {
        return {
            issue: this.issueId,
            from: this.from,
            size: this.size,
            count: this.count,
            creator: this.creator ? this.creator.toString() : undefined
        };
    }

    parseResponse(response: JsonResponse<ListIssueCommentsResult>): ListIssueCommentsResponse {
        const issueComments: IssueComment[] = response.getResult().issueComments.map(IssueComment.fromJson).sort((a, b) => {
            return a.getCreatedTime().getTime() - b.getCreatedTime().getTime();
        });

        const metadata = ResultMetadata.fromJson(response.getResult().metadata);

        return new ListIssueCommentsResponse(issueComments, metadata);
    }
}
