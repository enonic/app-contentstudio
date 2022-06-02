import {ResourceRequest} from '@enonic/lib-admin-ui/rest/ResourceRequest';
import {UrlHelper} from '../util/UrlHelper';

export abstract class CmsResourceRequest<PARSED_TYPE>
    extends ResourceRequest<PARSED_TYPE> {

    getPostfixUri() {
        return UrlHelper.getCmsRestUri('');
    }
}
