import {ContentId} from 'lib-admin-ui/content/ContentId';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {PageTemplateResourceRequest} from '../../resource/PageTemplateResourceRequest';
import {PageTemplate} from '../../content/PageTemplate';
import {ContentJson} from '../../content/ContentJson';
import {ContentTypeName} from 'lib-admin-ui/schema/content/ContentTypeName';

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

    getParams(): Object {
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
