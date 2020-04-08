import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {Issue} from '../Issue';
import {IssueJson} from '../json/IssueJson';
import {IssueResourceRequest} from './IssueResourceRequest';
import {IssuesJson} from '../json/IssuesJson';
import {HttpMethod} from 'lib-admin-ui/rest/HttpMethod';

export class GetIssuesRequest extends IssueResourceRequest<Issue[]> {

    private ids: string[];

    constructor(ids: string[]) {
        super();
        this.setMethod(HttpMethod.POST);

        this.ids = ids;
        this.addRequestPathElements('getIssues');
    }

    getParams(): Object {
        return {ids: this.ids};
    }

    parseResponse(response: JsonResponse<IssuesJson>): Issue[] {
        return response.getResult().issues.map((issueJson: IssueJson) => {
            return Issue.fromJson(issueJson);
        });
    }
}
