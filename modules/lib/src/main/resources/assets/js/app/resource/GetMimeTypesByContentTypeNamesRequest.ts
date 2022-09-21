import * as Q from 'q';
import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {ContentTypeResourceRequest} from './ContentTypeResourceRequest';
import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';

export class GetMimeTypesByContentTypeNamesRequest
    extends ContentTypeResourceRequest<String[]> {

    private readonly names: ContentTypeName[];
    private readonly namesAsString: string;

    private static cache: Map<string, String[]> = new Map<string, String[]>();

    constructor(names: ContentTypeName[]) {
        super();
        this.names = names;
        this.namesAsString = this.names.map(name => name.toString()).sort().join(',');
        this.addRequestPathElements('getMimeTypes');
    }

    sendAndParse(): Q.Promise<String[]> {
        if (!GetMimeTypesByContentTypeNamesRequest.cache.has(this.namesAsString)) {
            return super.sendAndParse();
        }

        return Q(GetMimeTypesByContentTypeNamesRequest.cache.get(this.namesAsString));
    }

    getParams(): Object {
        return {
            typeNames: this.namesAsString
        };
    }

    protected parseResponse(response: JsonResponse<String[]>): String[] {
        const responseAsJson: String[] = response.getJson();
        GetMimeTypesByContentTypeNamesRequest.cache.set(this.namesAsString, responseAsJson);
        return responseAsJson;
    }
}
