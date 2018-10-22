import {ContentTypeResourceRequest} from './ContentTypeResourceRequest';
import ContentTypeName = api.schema.content.ContentTypeName;

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

    getRequestPath(): api.rest.Path {
        return api.rest.Path.fromParent(super.getResourcePath(), 'getMimeTypes');
    }

    sendAndParse(): wemQ.Promise<String[]> {
        return this.send().then((response: api.rest.JsonResponse<String[]>) => {
            return response.getJson();
        });
    }
}
