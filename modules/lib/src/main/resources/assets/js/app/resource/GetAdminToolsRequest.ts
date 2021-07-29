import {Path} from 'lib-admin-ui/rest/Path';
import {ResourceRequest} from 'lib-admin-ui/rest/ResourceRequest';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {AdminToolJson} from './json/AdminToolJson';
import {AdminTool} from '../AdminTool';

declare const CONFIG;

export class GetAdminToolsRequest
    extends ResourceRequest<AdminTool[]> {

    getRequestPath(): Path {
        return CONFIG.services.adminToolsUrl;
    }

    protected parseResponse(response: JsonResponse<AdminToolJson[]>): AdminTool[] {
        return response.getResult().map((json: AdminToolJson) => AdminTool.fromJSON(json));
    }
}
