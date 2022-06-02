import {FindPrincipalsRequest as BaseFindPrincipalsRequest} from '@enonic/lib-admin-ui/security/FindPrincipalsRequest';
import {UrlHelper} from '../util/UrlHelper';

export class FindPrincipalsRequest
    extends BaseFindPrincipalsRequest {

    protected getPostfixUri() {
        return UrlHelper.getCmsRestUri('');
    }
}
