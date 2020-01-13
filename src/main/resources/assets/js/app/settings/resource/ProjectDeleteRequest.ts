import {ProjectResourceRequest} from './ProjectResourceRequest';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';

export class ProjectDeleteRequest
    extends ProjectResourceRequest<boolean, boolean> {

    private name: string;

    constructor(name: string) {
        super();
        this.setMethod('POST');
        this.addRequestPathElements('delete');
        this.name = name;
    }

    getParams(): Object {
        return {
            name: this.name
        };
    }

    protected processResponse(response: JsonResponse<boolean>): boolean {
        return !!response.getResult();
    }

}
