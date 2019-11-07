import * as Q from 'q';
import {Path} from 'lib-admin-ui/rest/Path';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {ContentTypeName} from 'lib-admin-ui/schema/content/ContentTypeName';
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

    getRequestPath(): Path {
        return super.getResourcePath();
    }

    sendAndParse(): Q.Promise<ContentType> {

        let contentTypeCache = ContentTypeCache.get();
        let contentType = contentTypeCache.getByKey(this.name);
        if (contentType) {
            return Q(contentType);
        } else {
            return this.send().then((response: JsonResponse<ContentTypeJson>) => {
                contentType = this.fromJsonToContentType(response.getResult());
                contentTypeCache.put(contentType);
                return contentType;
            });
        }
    }
}
