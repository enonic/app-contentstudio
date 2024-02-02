import {PrincipalLoader} from '@enonic/lib-admin-ui/security/PrincipalLoader';
import {UrlHelper} from '../util/UrlHelper';

export class CSPrincipalLoader
    extends PrincipalLoader {

    constructor() {
        super(UrlHelper.getCmsRestUri(''));
    }
}
