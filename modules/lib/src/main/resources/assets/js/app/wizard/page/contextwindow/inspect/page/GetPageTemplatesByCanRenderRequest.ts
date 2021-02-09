import {ContentId} from 'lib-admin-ui/content/ContentId';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {PageTemplateResourceRequest} from '../../../../../resource/PageTemplateResourceRequest';
import {ListContentResult} from '../../../../../resource/ListContentResult';
import {PageTemplate} from '../../../../../content/PageTemplate';
import {ContentJson} from '../../../../../content/ContentJson';
import {ContentTypeName} from 'lib-admin-ui/schema/content/ContentTypeName';

export class GetPageTemplatesByCanRenderRequest
    extends PageTemplateResourceRequest<PageTemplate[]> {

    private site: ContentId;

    private contentTypeName: ContentTypeName;

    constructor(site: ContentId, contentTypeName: ContentTypeName) {
        super();
        this.site = site;
        this.contentTypeName = contentTypeName;
        this.addRequestPathElements('listByCanRender');
    }

    getParams(): Object {
        return {
            siteId: this.site.toString(),
            contentTypeName: this.contentTypeName.toString()
        };
    }

    protected parseResponse(response: JsonResponse<ListContentResult<ContentJson>>): PageTemplate[] {
        return response.getResult().contents.map((contentJson: ContentJson) => {
            return this.fromJsonToContent(contentJson);
        });
    }
}
