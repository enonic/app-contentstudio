import * as Q from 'q';
import {Path} from 'lib-admin-ui/rest/Path';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {IssueStatsJson} from '../json/IssueStatsJson';
import {IssueResourceRequest} from './IssueResourceRequest';
import {IssueType} from '../IssueType';

export class GetIssueStatsRequest extends IssueResourceRequest<IssueStatsJson, IssueStatsJson> {

    private readonly type: IssueType;

    constructor(type?: IssueType) {
        super();
        this.setMethod('POST');
        this.type = type;
    }

    getParams(): Object {
        const type = this.type != null ? IssueType[this.type] : null;
        return {
            type
        };
    }

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), 'stats');
    }

    sendAndParse(): Q.Promise<IssueStatsJson> {
        return this.send().then((response: JsonResponse<IssueStatsJson>) => {
            return response.getResult();
        });
    }
}
