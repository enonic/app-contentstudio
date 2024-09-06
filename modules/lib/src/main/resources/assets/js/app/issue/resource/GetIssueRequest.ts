import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {Issue} from '../Issue';
import {IssueJson} from '../json/IssueJson';
import {CmsIssueResourceRequest} from './CmsIssueResourceRequest';

export class GetIssueRequest
    extends CmsIssueResourceRequest<Issue> {

    private id: string;

    constructor(id: string) {
        super();

        this.id = id;
        this.addRequestPathElements('id');
    }

    getParams(): object {
        return {id: this.id};
    }

    parseResponse(response: JsonResponse<IssueJson>): Issue {
        return Issue.fromJson(response.getResult());
    }
}
