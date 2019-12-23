import {ProjectResourceRequest} from './ProjectResourceRequest';
import {Path} from 'lib-admin-ui/rest/Path';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';

export class ProjectDeleteRequest
    extends ProjectResourceRequest<boolean, boolean> {

    private name: string;

    constructor(name: string) {
        super();
        this.setMethod('POST');
        this.name = name;
    }

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), 'delete');
    }

    getParams(): Object {
        return {
            name: this.name
        };
    }

    sendAndParse(): Q.Promise<boolean> {
        return this.send().then((response: JsonResponse<boolean>) => {
            return !!response.getResult();
        });
    }

}
