import {PrincipalLoader as LibPrincipalLoader} from 'lib-admin-ui/security/PrincipalLoader';
import {PrincipalKey} from 'lib-admin-ui/security/PrincipalKey';
import {FindPrincipalsRequest} from './FindPrincipalsRequest';
import {GetPrincipalsByKeysRequest} from './GetPrincipalsByKeysRequest';

export class PrincipalLoader
    extends LibPrincipalLoader {

    protected createRequest(): FindPrincipalsRequest {
        return <FindPrincipalsRequest>new FindPrincipalsRequest().setSize(10);
    }

    protected createPreLoadRequest(principalKeys: PrincipalKey[]): GetPrincipalsByKeysRequest {
        return new GetPrincipalsByKeysRequest(principalKeys);
    }
}
