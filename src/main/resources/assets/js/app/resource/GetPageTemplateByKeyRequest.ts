import * as Q from 'q';
import {Path} from 'lib-admin-ui/rest/Path';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {PageTemplateResourceRequest} from './PageTemplateResourceRequest';
import {PageTemplate} from '../content/PageTemplate';
import {ContentJson} from '../content/ContentJson';
import {PageTemplateKey} from '../page/PageTemplateKey';
import {assertNotNull} from 'lib-admin-ui/util/Assert';

export class GetPageTemplateByKeyRequest
    extends PageTemplateResourceRequest<ContentJson, PageTemplate> {

    private pageTemplateKey: PageTemplateKey;

    constructor(pageTemplateKey: PageTemplateKey) {
        super();
        super.setMethod('GET');
        this.pageTemplateKey = pageTemplateKey;
    }

    validate() {
        assertNotNull(this.pageTemplateKey, 'pageTemplateKey cannot be null');
    }

    getParams(): Object {
        return {
            key: this.pageTemplateKey.toString()
        };
    }

    getRequestPath(): Path {
        return super.getResourcePath();
    }

    sendAndParse(): Q.Promise<PageTemplate> {

        return this.send().then((response: JsonResponse<ContentJson>) => {
            return this.fromJsonToContent(response.getResult());
        });
    }
}
