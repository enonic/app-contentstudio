import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {IssueStatsJson} from '../json/IssueStatsJson';
import {IssueResourceRequest} from './IssueResourceRequest';
import {IssueType} from '../IssueType';
import {HttpMethod} from 'lib-admin-ui/rest/HttpMethod';

export class GetIssueStatsRequest extends IssueResourceRequest<IssueStatsJson, IssueStatsJson> {

    private readonly type: IssueType;

    constructor(type?: IssueType) {
        super();
        this.setMethod(HttpMethod.POST);
        this.type = type;
        this.addRequestPathElements('stats');
    }

    getParams(): Object {
        const type = this.type != null ? IssueType[this.type] : null;
        return {
            type
        };
    }

    processResponse(response: JsonResponse<IssueStatsJson>): IssueStatsJson {
        return response.getResult();
    }
}
