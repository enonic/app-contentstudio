import {PrincipalSelector as BasePrincipalSelector} from '@enonic/lib-admin-ui/form/inputtype/principal/PrincipalSelector';
import {InputTypeManager} from '@enonic/lib-admin-ui/form/inputtype/InputTypeManager';
import {Class} from '@enonic/lib-admin-ui/Class';
import {InputTypeName} from '@enonic/lib-admin-ui/form/InputTypeName';
import {type PrincipalLoader} from '@enonic/lib-admin-ui/security/PrincipalLoader';
import {CSPrincipalLoader} from '../../security/CSPrincipalLoader';

export class PrincipalSelector
    extends BasePrincipalSelector {

    protected createLoader(): PrincipalLoader {
        return new CSPrincipalLoader();
    }

    static getName(): InputTypeName {
        return new InputTypeName('PrincipalSelector', false);
    }
}

InputTypeManager.register(new Class('PrincipalSelector', PrincipalSelector), true);
