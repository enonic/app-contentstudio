import {Path} from '@enonic/lib-admin-ui/rest/Path';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';
import {ResourceRequest} from '@enonic/lib-admin-ui/rest/ResourceRequest';

export abstract class ProjectApplicationsRequest<RESPONSE_TYPE>
    extends ResourceRequest<RESPONSE_TYPE> {

    abstract getOperationType(): string;

    getParams(): Object {
        return {
            type: this.getOperationType()
        };
    }

    getRequestPath(): Path {
        return Path.fromString(CONFIG.getString('services.appServiceUrl'));
    }
}
