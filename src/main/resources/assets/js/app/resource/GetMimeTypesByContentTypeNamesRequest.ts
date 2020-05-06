import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {ContentTypeResourceRequest} from './ContentTypeResourceRequest';
import {ContentTypeName} from 'lib-admin-ui/schema/content/ContentTypeName';

export class GetMimeTypesByContentTypeNamesRequest
    extends ContentTypeResourceRequest<String[]> {

    private names: ContentTypeName[];

    constructor(names: ContentTypeName[]) {
        super();
        this.names = names;
        this.addRequestPathElements('getMimeTypes');
    }

    getParams(): Object {
        return {
            typeNames: this.names.map(name => name.toString()).join(',')
        };
    }

    protected parseResponse(response: JsonResponse<String[]>): String[] {
        return response.getJson();
    }
}
