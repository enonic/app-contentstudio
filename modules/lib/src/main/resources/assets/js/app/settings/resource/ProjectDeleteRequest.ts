import {ProjectResourceRequest} from './ProjectResourceRequest';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {HttpMethod} from 'lib-admin-ui/rest/HttpMethod';

export class ProjectDeleteRequest
    extends ProjectResourceRequest<boolean> {

    private name: string;

    constructor(name: string) {
        super();
        this.setMethod(HttpMethod.POST);
        this.addRequestPathElements('delete');
        this.name = name;
    }

    getParams(): Object {
        return {
            name: this.name
        };
    }

    protected parseResponse(response: JsonResponse<boolean>): boolean {
        return !!response.getResult();
    }

}
