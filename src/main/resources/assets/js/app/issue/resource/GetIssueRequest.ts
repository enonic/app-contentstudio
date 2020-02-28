import * as Q from 'q';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {Issue} from '../Issue';
import {IssueJson} from '../json/IssueJson';
import {IssueResourceRequest} from './IssueResourceRequest';

export class GetIssueRequest extends IssueResourceRequest<IssueJson, Issue> {

    private id: string;

    constructor(id: string) {
        super();

        this.id = id;
        this.addRequestPathElements('id');
    }

    getParams(): Object {
        return {id: this.id};
    }

    sendAndParse(): Q.Promise<Issue> {
        return this.send().then((response: JsonResponse<IssueJson>) => {
            return Issue.fromJson(response.getResult());
        });
    }

    processResponse(response: JsonResponse<IssueJson>): Issue {
        return Issue.fromJson(response.getResult());
    }
}
