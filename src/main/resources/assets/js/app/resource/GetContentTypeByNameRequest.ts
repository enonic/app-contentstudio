import ContentTypeResourceRequest = api.schema.content.ContentTypeResourceRequest;
import ContentType = api.schema.content.ContentType;
import ContentTypeJson = api.schema.content.ContentTypeJson;
import ContentTypeCache = api.schema.content.ContentTypeCache;
import ContentTypeName = api.schema.content.ContentTypeName;

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
