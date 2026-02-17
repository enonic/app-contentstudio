import {type JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {PageTemplateResourceRequest} from '../../resource/PageTemplateResourceRequest';
import {type PageTemplate} from '../../content/PageTemplate';
import {type ContentJson} from '../../content/ContentJson';
import {type ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {type ContentId} from '../../content/ContentId';

export class GetDefaultPageTemplateRequest
    extends PageTemplateResourceRequest<PageTemplate> {

    private site: ContentId;

    private contentTypeName: ContentTypeName;

    constructor(site: ContentId, contentName: ContentTypeName) {
        super();
        this.site = site;
        this.contentTypeName = contentName;
        this.addRequestPathElements('default');
    }

    getParams(): object {
        return {
            siteId: this.site.toString(),
            contentTypeName: this.contentTypeName.toString()
        };
    }

    protected parseResponse(response: JsonResponse<ContentJson>): PageTemplate {
        if (response.hasResult()) {
            return this.fromJsonToContent(response.getResult());
        } else {
            return null;
        }
    }
}
