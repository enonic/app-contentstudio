import * as Q from 'q';
import {Path} from 'lib-admin-ui/rest/Path';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {PageTemplateResourceRequest} from '../../resource/PageTemplateResourceRequest';
import {PageTemplate} from '../../content/PageTemplate';
import {ContentJson} from '../../content/ContentJson';
import {ContentTypeName} from 'lib-admin-ui/schema/content/ContentTypeName';

export class GetDefaultPageTemplateRequest
    extends PageTemplateResourceRequest<ContentJson, PageTemplate> {

    private site: ContentId;

    private contentTypeName: ContentTypeName;

    constructor(site: ContentId, contentName: ContentTypeName) {
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

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), 'default');
    }

    sendAndParse(): Q.Promise<PageTemplate> {

        return this.send().then((response: JsonResponse<ContentJson>) => {

            if (response.hasResult()) {
                return this.fromJsonToContent(response.getResult());
            } else {
                return null;
            }
        });
    }
}
