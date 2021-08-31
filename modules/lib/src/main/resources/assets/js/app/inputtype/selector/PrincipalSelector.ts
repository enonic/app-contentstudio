import {PrincipalSelector as LibPrincipalSelector} from 'lib-admin-ui/form/inputtype/principal/PrincipalSelector';
import {PrincipalLoader as LibPrincipalLoader} from 'lib-admin-ui/security/PrincipalLoader';
import {PrincipalLoader} from '../../security/PrincipalLoader';
import {InputTypeManager} from 'lib-admin-ui/form/inputtype/InputTypeManager';
import {Class} from 'lib-admin-ui/Class';

import {InputTypeName} from 'lib-admin-ui/form/InputTypeName';

export class PrincipalSelector
    extends LibPrincipalSelector {

    protected createLoader(): LibPrincipalLoader {
        return new PrincipalLoader();
    }

    static getName(): InputTypeName {
        return new InputTypeName('ContentPrincipalSelector', false);
    }
}

InputTypeManager.register(new Class('ContentPrincipalSelector', PrincipalSelector));
