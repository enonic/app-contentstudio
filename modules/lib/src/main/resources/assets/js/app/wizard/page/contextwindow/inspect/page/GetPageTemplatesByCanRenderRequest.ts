import {type JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {PageTemplateResourceRequest} from '../../../../../resource/PageTemplateResourceRequest';
import {type ListContentResult} from '../../../../../resource/ListContentResult';
import {type PageTemplate} from '../../../../../content/PageTemplate';
import {type ContentJson} from '../../../../../content/ContentJson';
import {type ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {type ContentId} from '../../../../../content/ContentId';

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

    getParams(): object {
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
