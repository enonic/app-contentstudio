import {GetPrincipalsByKeysRequest as LibGetPrincipalsByKeysRequest} from 'lib-admin-ui/security/GetPrincipalsByKeysRequest';
import {UrlHelper} from '../util/UrlHelper';

export class GetPrincipalsByKeysRequest
    extends LibGetPrincipalsByKeysRequest {

    getPostfixUri() {
        return UrlHelper.getCmsRestUri('');
    }
}
