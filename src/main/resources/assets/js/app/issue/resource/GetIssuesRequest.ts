import * as Q from 'q';
import {Path} from 'lib-admin-ui/rest/Path';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {Issue} from '../Issue';
import {IssueJson} from '../json/IssueJson';
import {IssueResourceRequest} from './IssueResourceRequest';
import {IssuesJson} from '../json/IssuesJson';

export class GetIssuesRequest extends IssueResourceRequest<IssuesJson, Issue[]> {

    private ids: string[];

    constructor(ids: string[]) {
        super();
        super.setMethod('POST');

        this.ids = ids;
    }

    getParams(): Object {
        return {ids: this.ids};
    }

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), 'getIssues');
    }

    sendAndParse(): Q.Promise<Issue[]> {
        return this.send().then((response: JsonResponse<IssuesJson>) => {
            return response.getResult().issues.map((issueJson: IssueJson) => {
                return Issue.fromJson(issueJson);
            });
        });
    }
}
