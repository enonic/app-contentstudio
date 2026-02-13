import {PrincipalComboBox, type PrincipalComboBoxParams} from '@enonic/lib-admin-ui/ui/security/PrincipalComboBox';
import {UrlHelper} from '../util/UrlHelper';

export class CSPrincipalCombobox extends PrincipalComboBox {

    constructor(options?: PrincipalComboBoxParams) {
        options.postfixUri = options.postfixUri ?? UrlHelper.getCmsRestUri(''); // override the default postfixUri
        super(options);
    }
}
