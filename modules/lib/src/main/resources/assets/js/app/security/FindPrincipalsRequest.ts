import {FindPrincipalsRequest as LibFindPrincipalsRequest} from 'lib-admin-ui/security/FindPrincipalsRequest';
import {UrlHelper} from '../util/UrlHelper';

export class FindPrincipalsRequest
    extends LibFindPrincipalsRequest {

    protected getPostfixUri() {
        return UrlHelper.getCmsRestUri('');
    }
}
