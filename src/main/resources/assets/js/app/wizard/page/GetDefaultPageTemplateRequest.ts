import {PageTemplateResourceRequest} from '../../resource/PageTemplateResourceRequest';
import {PageTemplate} from '../../content/PageTemplate';
import {ContentJson} from '../../content/ContentJson';

export class GetDefaultPageTemplateRequest
    extends PageTemplateResourceRequest<ContentJson, PageTemplate> {

    private site: api.content.ContentId;

    private contentTypeName: api.schema.content.ContentTypeName;

    constructor(site: api.content.ContentId, contentName: api.schema.content.ContentTypeName) {
        super();
        this.setMethod('GET');
        this.site = site;
        this.contentTypeName = contentName;
    }

    getParams(): Object {
        return {
            siteId: this.site.toString(),
            contentTypeName: this.contentTypeName.toString()
        };
    }

    getRequestPath(): api.rest.Path {
        return api.rest.Path.fromParent(super.getResourcePath(), 'default');
    }

    sendAndParse(): wemQ.Promise<PageTemplate> {

        return this.send().then((response: api.rest.JsonResponse<ContentJson>) => {

            if (response.hasResult()) {
                return this.fromJsonToContent(response.getResult());
            } else {
                return null;
            }
        });
    }
}
