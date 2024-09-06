import * as Q from 'q';
import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {ContentTypeResourceRequest} from './ContentTypeResourceRequest';
import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';

export class GetMimeTypesByContentTypeNamesRequest
    extends ContentTypeResourceRequest<string[]> {

    private readonly names: ContentTypeName[];
    private readonly namesAsString: string;

    private static cache: Map<string, Q.Promise<string[]>> = new Map<string, Q.Promise<string[]>>();

    constructor(names: ContentTypeName[]) {
        super();
        this.names = names;
        this.namesAsString = this.names.map((name: ContentTypeName) => name.toString()).sort().join(',');
        this.addRequestPathElements('getMimeTypes');
    }

    sendAndParse(): Q.Promise<string[]> {
        if (!GetMimeTypesByContentTypeNamesRequest.cache.has(this.namesAsString)) {
            GetMimeTypesByContentTypeNamesRequest.cache.set(this.namesAsString, super.sendAndParse());
        }

        return GetMimeTypesByContentTypeNamesRequest.cache.get(this.namesAsString);
    }

    getParams(): object {
        return {
            typeNames: this.namesAsString
        };
    }

    protected parseResponse(response: JsonResponse<string[]>): string[] {
        return response.getJson();
    }
}
