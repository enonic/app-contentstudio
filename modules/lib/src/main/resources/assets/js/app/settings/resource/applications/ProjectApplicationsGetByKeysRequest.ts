import {ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {ProjectApplication} from '../../wizard/panel/form/element/ProjectApplication';
import {ProjectApplicationJson} from '../json/applications/ProjectApplicationJson';
import {ProjectApplicationsRequest} from './ProjectApplicationsRequest';


export class ProjectApplicationsGetByKeysRequest
    extends ProjectApplicationsRequest<ProjectApplication[]> {

    private keys: ApplicationKey[];

    constructor(keys?: ApplicationKey[]) {
        super();

        this.keys = keys || [];
    }

    addKey(key: ApplicationKey): ProjectApplicationsGetByKeysRequest {
        if (key) {
            this.keys.push(key);
        }

        return this;
    }

    getParams(): Object {
        const params: Object = super.getParams();
        params['keys'] = this.getKeysAsString();

        return params;
    }

    getOperationType(): string {
        return 'get';
    }

    private getKeysAsString(): string {
        return this.keys.map((key: ApplicationKey) => key.toString()).join();
    }

    protected parseResponse(response: JsonResponse<ProjectApplicationJson[]>): ProjectApplication[] {
        return ProjectApplication.fromJsonArray(response.getResult());
    }
}
