import * as Q from 'q';
import {Path} from 'lib-admin-ui/rest/Path';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {PageTemplateResourceRequest} from '../../../../../resource/PageTemplateResourceRequest';
import {ListContentResult} from '../../../../../resource/ListContentResult';
import {PageTemplate} from '../../../../../content/PageTemplate';
import {ContentJson} from '../../../../../content/ContentJson';
import {ContentTypeName} from 'lib-admin-ui/schema/content/ContentTypeName';

export class GetPageTemplatesByCanRenderRequest
    extends PageTemplateResourceRequest<ListContentResult<ContentJson>, PageTemplate[]> {

    private site: ContentId;

    private contentTypeName: ContentTypeName;

    constructor(site: ContentId, contentTypeName: ContentTypeName) {
        super();
        this.setMethod('GET');
        this.site = site;
        this.contentTypeName = contentTypeName;
    }

    getParams(): Object {
        return {
            siteId: this.site.toString(),
            contentTypeName: this.contentTypeName.toString()
        };
    }

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), 'listByCanRender');
    }

    sendAndParse(): Q.Promise<PageTemplate[]> {

        return this.send().then((response: JsonResponse<ListContentResult<ContentJson>>) => {
            return response.getResult().contents.map((contentJson: ContentJson) => {
                return this.fromJsonToContent(contentJson);
            });
        });
    }
}
