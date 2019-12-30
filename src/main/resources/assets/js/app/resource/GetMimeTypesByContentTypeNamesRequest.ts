import * as Q from 'q';
import {Path} from 'lib-admin-ui/rest/Path';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {ContentTypeResourceRequest} from './ContentTypeResourceRequest';
import {ContentTypeName} from 'lib-admin-ui/schema/content/ContentTypeName';

export class GetMimeTypesByContentTypeNamesRequest
    extends ContentTypeResourceRequest<String[], String[]> {

    private names: ContentTypeName[];

    constructor(names: ContentTypeName[]) {
        super();
        super.setMethod('GET');
        this.names = names;
    }

    getParams(): Object {
        return {
            typeNames: this.names.map(name => name.toString()).join(',')
        };
    }

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), 'getMimeTypes');
    }

    sendAndParse(): Q.Promise<String[]> {
        return this.send().then((response: JsonResponse<String[]>) => {
            return response.getJson();
        });
    }
}
