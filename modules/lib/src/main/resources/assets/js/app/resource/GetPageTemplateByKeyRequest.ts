import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {PageTemplateResourceRequest} from './PageTemplateResourceRequest';
import {PageTemplate} from '../content/PageTemplate';
import {ContentJson} from '../content/ContentJson';
import {PageTemplateKey} from '../page/PageTemplateKey';
import {assertNotNull} from '@enonic/lib-admin-ui/util/Assert';

export class GetPageTemplateByKeyRequest
    extends PageTemplateResourceRequest<PageTemplate> {

    private pageTemplateKey: PageTemplateKey;

    constructor(pageTemplateKey: PageTemplateKey) {
        super();
        this.pageTemplateKey = pageTemplateKey;
    }

    validate() {
        assertNotNull(this.pageTemplateKey, 'pageTemplateKey cannot be null');
    }

    getParams(): object {
        return {
            key: this.pageTemplateKey.toString()
        };
    }

    protected parseResponse(response: JsonResponse<ContentJson>): PageTemplate {
        return this.fromJsonToContent(response.getResult());
    }
}
