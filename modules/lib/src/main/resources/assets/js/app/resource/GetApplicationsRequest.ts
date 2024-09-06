import {Application} from '@enonic/lib-admin-ui/application/Application';
import {ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import {ApplicationListResult} from '@enonic/lib-admin-ui/application/ApplicationListResult';
import {ApplicationResourceRequest} from '@enonic/lib-admin-ui/application/ApplicationResourceRequest';
import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {UrlHelper} from '../util/UrlHelper';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';

export class GetApplicationsRequest
    extends ApplicationResourceRequest<Application[]> {

    private readonly keys: ApplicationKey[];

    constructor(keys: ApplicationKey[]) {
        super();

        this.keys = keys || [];

        this.setMethod(HttpMethod.POST);
        this.addRequestPathElements('getApplicationsByKeys');
    }

    getParams(): object {
        return {
            applicationKeys: this.keys.map((key: ApplicationKey) => key.toString())
        };
    }

    getPostfixUri() {
        return UrlHelper.getCmsRestUri('');
    }

    protected parseResponse(response: JsonResponse<ApplicationListResult>): Application[] {
        return Application.fromJsonArray(response.getResult().applications);
    }
}
