import {PrincipalLoader as BasePrincipalLoader} from '@enonic/lib-admin-ui/security/PrincipalLoader';
import {PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';
import {FindPrincipalsRequest} from './FindPrincipalsRequest';
import {GetPrincipalsByKeysRequest} from './GetPrincipalsByKeysRequest';

export class PrincipalLoader
    extends BasePrincipalLoader {

    protected createRequest(): FindPrincipalsRequest {
        return <FindPrincipalsRequest>new FindPrincipalsRequest().setSize(10);
    }

    protected createPreLoadRequest(principalKeys: PrincipalKey[]): GetPrincipalsByKeysRequest {
        return new GetPrincipalsByKeysRequest(principalKeys);
    }
}
