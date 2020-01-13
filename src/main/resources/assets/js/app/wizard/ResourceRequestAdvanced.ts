import {ResourceRequest} from 'lib-admin-ui/rest/ResourceRequest';
import {Path} from 'lib-admin-ui/rest/Path';
import * as Q from 'q';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';

export abstract class ResourceRequestAdvanced<JSON_TYPE, PARSED_TYPE>
    extends ResourceRequest<JSON_TYPE, PARSED_TYPE> {

    private pathElements: string[] = [];

    getRequestPath(): Path {
        return Path.fromParent(this.getRestPath(), ...this.pathElements);
    }

    protected addRequestPathElements(...items: string[]) {
        this.pathElements.push(...items);
    }

    sendAndParse(): Q.Promise<PARSED_TYPE> {
        return this.send().then((response: JsonResponse<JSON_TYPE>) => {
            return this.processResponse(response);
        });
    }

    protected abstract processResponse(response: JsonResponse<JSON_TYPE>): PARSED_TYPE;
}
