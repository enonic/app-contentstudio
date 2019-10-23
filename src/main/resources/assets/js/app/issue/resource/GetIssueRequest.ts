import * as Q from 'q';
import {Path} from 'lib-admin-ui/rest/Path';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {Issue} from '../Issue';
import {IssueJson} from '../json/IssueJson';
import {IssueResourceRequest} from './IssueResourceRequest';

export class GetIssueRequest extends IssueResourceRequest<IssueJson, Issue> {

    private id: string;

    constructor(id: string) {
        super();
        super.setMethod('GET');

        this.id = id;
    }

    getParams(): Object {
        return {id: this.id};
    }

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), 'id');
    }

    sendAndParse(): Q.Promise<Issue> {
        return this.send().then((response: JsonResponse<IssueJson>) => {
            return Issue.fromJson(response.getResult());
        });
    }
}
