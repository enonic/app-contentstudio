import * as Q from 'q';
import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {ContentTypeCache} from '../content/ContentTypeCache';
import {ContentTypeResourceRequest} from './ContentTypeResourceRequest';
import {ContentType} from '../inputtype/schema/ContentType';
import {ContentTypeJson} from './json/ContentTypeJson';

export class GetContentTypeByNameRequest
    extends ContentTypeResourceRequest<ContentType> {

    private readonly name: ContentTypeName;

    private inlineMixinsToFormItems: boolean = true;

    constructor(name: ContentTypeName) {
        super();
        this.name = name;
    }

    getParams(): Object {
        return {
            name: this.name.toString(),
            inlineMixinsToFormItems: this.inlineMixinsToFormItems
        };
    }

    sendAndParse(): Q.Promise<ContentType> {
        const contentTypeCache: ContentTypeCache = ContentTypeCache.get();
        const contentType: ContentType = contentTypeCache.getByKey(this.name);
        if (contentType) {
            return Q(contentType);
        }

        return super.sendAndParse();

    }

    protected parseResponse(response: JsonResponse<ContentTypeJson>): ContentType {
        const contentType: ContentType = this.fromJsonToContentType(response.getResult());
        const contentTypeCache: ContentTypeCache = ContentTypeCache.get();
        contentTypeCache.put(contentType);
        return contentType;
    }
}
