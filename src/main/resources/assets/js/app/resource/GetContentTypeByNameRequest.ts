import ContentTypeName = api.schema.content.ContentTypeName;
import {ContentTypeCache} from '../content/ContentTypeCache';
import {ContentTypeResourceRequest} from './ContentTypeResourceRequest';
import {ContentType} from '../inputtype/schema/ContentType';
import {ContentTypeJson} from './json/ContentTypeJson';

export class GetContentTypeByNameRequest
    extends ContentTypeResourceRequest<ContentTypeJson, ContentType> {

    private name: ContentTypeName;

    private inlineMixinsToFormItems: boolean = true;

    constructor(name: ContentTypeName) {
        super();
        super.setMethod('GET');
        this.name = name;
    }

    getParams(): Object {
        return {
            name: this.name.toString(),
            inlineMixinsToFormItems: this.inlineMixinsToFormItems
        };
    }

    getRequestPath(): api.rest.Path {
        return super.getResourcePath();
    }

    sendAndParse(): wemQ.Promise<ContentType> {

        let contentTypeCache = ContentTypeCache.get();
        let contentType = contentTypeCache.getByKey(this.name);
        if (contentType) {
            return wemQ(contentType);
        } else {
            return this.send().then((response: api.rest.JsonResponse<ContentTypeJson>) => {
                contentType = this.fromJsonToContentType(response.getResult());
                contentTypeCache.put(contentType);
                return contentType;
            });
        }
    }
}
