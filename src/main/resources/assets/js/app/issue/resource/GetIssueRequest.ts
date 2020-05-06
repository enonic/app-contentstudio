import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {Issue} from '../Issue';
import {IssueJson} from '../json/IssueJson';
import {IssueResourceRequest} from './IssueResourceRequest';

export class GetIssueRequest extends IssueResourceRequest<Issue> {

    private id: string;

    constructor(id: string) {
        super();

        this.id = id;
        this.addRequestPathElements('id');
    }

    getParams(): Object {
        return {id: this.id};
    }

    parseResponse(response: JsonResponse<IssueJson>): Issue {
        return Issue.fromJson(response.getResult());
    }
}
