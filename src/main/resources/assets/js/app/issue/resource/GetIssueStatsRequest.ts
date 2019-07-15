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

    getRequestPath(): api.rest.Path {
        return api.rest.Path.fromParent(super.getResourcePath(), 'stats');
    }

    sendAndParse(): wemQ.Promise<IssueStatsJson> {
        return this.send().then((response: api.rest.JsonResponse<IssueStatsJson>) => {
            return response.getResult();
        });
    }
}
