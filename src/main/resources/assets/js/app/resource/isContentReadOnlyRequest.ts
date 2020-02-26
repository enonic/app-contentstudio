import * as Q from 'q';
import {Path} from 'lib-admin-ui/rest/Path';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {ContentResourceRequest} from './ContentResourceRequest';

export class IsContentReadOnlyRequest
    extends ContentResourceRequest<string[], string[]> {

    private ids: ContentId[];

    constructor(ids: ContentId[]) {
        super();
        super.setMethod('POST');
        this.ids = ids;
    }

    getParams(): Object {
        return {
            contentIds: this.ids.map(id => id.toString())
        };
    }

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), 'isReadOnlyContent');
    }

    sendAndParse(): Q.Promise<string[]> {
        return this.send().then((response: JsonResponse<string[]>) => {
            return response.getResult();
        });
    }
}
