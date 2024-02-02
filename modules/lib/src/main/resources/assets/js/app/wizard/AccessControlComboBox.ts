import {Option} from '@enonic/lib-admin-ui/ui/selector/Option';
import {AccessControlEntryView} from '../view/AccessControlEntryView';
import {AccessControlEntry} from '../access/AccessControlEntry';
import {Permission} from '../access/Permission';
import {PrincipalContainerCombobox, PrincipalContainerComboboxBuilder} from '@enonic/lib-admin-ui/ui/security/PrincipalContainerCombobox';
import {PrincipalContainerSelectedOptionsView} from '@enonic/lib-admin-ui/ui/security/PrincipalContainerSelectedOptionsView';
import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {PrincipalLoader} from '@enonic/lib-admin-ui/security/PrincipalLoader';
import {UrlHelper} from '../util/UrlHelper';
import {CSPrincipalLoader} from '../security/CSPrincipalLoader';

export class AccessControlComboBox
    extends PrincipalContainerCombobox<AccessControlEntry> {

    constructor(builder: AccessControlComboBoxBuilder) {
        super(builder);
    }

    protected loadedItemToDisplayValue(value: Principal): AccessControlEntry {
        return new AccessControlEntry(value);
    }
}

class ACESelectedOptionsView
    extends PrincipalContainerSelectedOptionsView<AccessControlEntry> {

    constructor() {
        super('access-control-list');
    }

    protected createSelectedEntryView(option: Option<AccessControlEntry>): AccessControlEntryView {
        const ace: AccessControlEntry = option.getDisplayValue();
        if (ace.getAllowedPermissions().length === 0 && ace.getDeniedPermissions().length === 0) {
            // allow read by default
            ace.allow(Permission.READ);
        }

        return new AccessControlEntryView(ace, option.isReadOnly());
    }

}

export class AccessControlComboBoxBuilder
    extends PrincipalContainerComboboxBuilder<AccessControlEntry> {

    selectedOptionsView: ACESelectedOptionsView = new ACESelectedOptionsView();

    loader: PrincipalLoader = new CSPrincipalLoader();

    build(): AccessControlComboBox {
        return new AccessControlComboBox(this);
    }
}
