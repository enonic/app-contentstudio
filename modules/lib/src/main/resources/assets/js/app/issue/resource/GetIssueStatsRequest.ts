import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {IssueStatsJson} from '../json/IssueStatsJson';
import {IssueType} from '../IssueType';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {CmsIssueResourceRequest} from './CmsIssueResourceRequest';

export class GetIssueStatsRequest
    extends CmsIssueResourceRequest<IssueStatsJson> {

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

    parseResponse(response: JsonResponse<IssueStatsJson>): IssueStatsJson {
        return response.getResult();
    }
}
