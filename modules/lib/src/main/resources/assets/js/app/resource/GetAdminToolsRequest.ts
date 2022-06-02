import {Path} from '@enonic/lib-admin-ui/rest/Path';
import {ResourceRequest} from '@enonic/lib-admin-ui/rest/ResourceRequest';
import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {AdminToolJson} from './json/AdminToolJson';
import {AdminTool} from '../AdminTool';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';

export class GetAdminToolsRequest
    extends ResourceRequest<AdminTool[]> {

    getRequestPath(): Path {
        return Path.fromString(CONFIG.getString('services.adminToolsUrl'));
    }

    protected parseResponse(response: JsonResponse<AdminToolJson[]>): AdminTool[] {
        return response.getResult().map((json: AdminToolJson) => AdminTool.fromJSON(json));
    }
}
